import type { PageBuilderFormField, PageBuilderFormItem } from '#modula/shared/pageBuilder'
import { pickLocalizedText } from '#modula/shared/pageBuilder'
import { resolvePublicCmsPage } from '#modula/server/utils/cms'
import { resolveAdminEmailTemplate } from '#modula/server/utils/adminEmailTemplates'
import { applyTemplateVars } from '#modula/server/utils/orderEmailContent'
import { buildGenericEmail } from '#modula/server/utils/orderEmails'
import { getReservationEmailHtmlLang } from '#modula/server/utils/orderEmailContent'
import { sendGmail } from '#modula/server/utils/gmail'
import { getContactEmail, getFeatureFlags } from '#modula/server/utils/settings'
import { enforceRateLimit } from '#modula/server/utils/rateLimit'
import { AuthService } from '#modula/server/services/auth/authService'

interface FormSubmitBody {
  pagePath?: string
  locale?: string
  formId?: string
  formKey?: string
  website?: string
  submittedAt?: number
  values?: Record<string, string | boolean>
}

function normalizeCmsPath(path: string, locale?: string) {
  const normalizedLocale = locale === 'en' ? 'en' : 'fr'
  const stripped = path.replace(new RegExp(`^/${normalizedLocale}(?=/|$)`), '') || '/'
  return stripped.startsWith('/') ? stripped : `/${stripped}`
}

function findFormItem(content: { sections: Array<{ columns: Array<{ items: any[] }> }> }, formId?: string, formKey?: string): PageBuilderFormItem | null {
  for (const section of content.sections ?? []) {
    for (const column of section.columns ?? []) {
      for (const item of column.items ?? []) {
        if (item?.type !== 'form') continue
        if ((formId && item.id === formId) || (formKey && item.formKey === formKey)) {
          return item as PageBuilderFormItem
        }
      }
    }
  }
  return null
}

function getAllFormFields(item: PageBuilderFormItem): PageBuilderFormField[] {
  return item.rows.flatMap(row => row.fields)
}

function stringifyFieldValue(field: PageBuilderFormField, value: string | boolean) {
  if (field.type === 'checkbox') {
    return value === true ? 'Oui' : 'Non'
  }
  return typeof value === 'string' ? value.trim() : ''
}

function parseEmailList(value: string) {
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
}

function firstNonEmptyFieldValue(fields: PageBuilderFormField[], values: Record<string, string | boolean>, pattern: RegExp) {
  for (const field of fields) {
    if (!pattern.test(field.name)) continue
    const value = values[field.name]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function buildTemplateVariables(
  locale: 'fr' | 'en',
  fields: PageBuilderFormField[],
  values: Record<string, string | boolean>,
  page: { title: string; path: string },
  form: PageBuilderFormItem,
  replyToEmail: string,
  currentUserEmail: string
) {
  const fieldEntries = fields.map((field) => [field.name, stringifyFieldValue(field, values[field.name] ?? '')] as const)
  const fieldVars = Object.fromEntries(fieldEntries)
  const prefixedFieldVars = Object.fromEntries(fieldEntries.map(([key, value]) => [`field_${key}`, value]))
  const contactName = firstNonEmptyFieldValue(fields, values, /name|nom/i)
  const contactEmail = firstNonEmptyFieldValue(fields, values, /mail|email|courriel/i)
  const contactMessage = firstNonEmptyFieldValue(fields, values, /message|msg|demande|contenu/i)
  const contactPhone = firstNonEmptyFieldValue(fields, values, /phone|telephone|tel|mobile/i)
  const fieldsSummary = fields
    .map((field) => `${pickLocalizedText(locale, field.label) || field.name}: ${stringifyFieldValue(field, values[field.name] as string | boolean)}`)
    .join('\n')

  return {
    formTitle: pickLocalizedText(locale, form.title) || form.formKey || 'Formulaire',
    pageTitle: page.title,
    pagePath: page.path,
    submittedAt: new Date().toLocaleString(locale === 'en' ? 'en-GB' : 'fr-FR'),
    fieldsSummary,
    replyToEmail,
    currentUserEmail,
    contactName,
    contactEmail,
    contactMessage,
    contactPhone,
    ...fieldVars,
    ...prefixedFieldVars
  }
}

function validateField(locale: string, field: PageBuilderFormField, rawValue: string | boolean | undefined) {
  const label = pickLocalizedText(locale, field.label) || field.name
  const message = pickLocalizedText(locale, field.errorMessage)

  if (field.type === 'checkbox') {
    if (field.required && rawValue !== true) {
      return message || `${label} est requis.`
    }
    return ''
  }

  const value = typeof rawValue === 'string' ? rawValue.trim() : ''
  if (field.required && !value) {
    return message || `${label} est requis.`
  }
  if (!value) return ''

  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return message || `${label} doit être un email valide.`
  }

  if (field.regexPattern) {
    try {
      const pattern = new RegExp(field.regexPattern)
      if (!pattern.test(value)) {
        return message || `${label} n'est pas valide.`
      }
    } catch {
      return ''
    }
  }

  return ''
}

async function executeInternalWebhook(actionKey: string, payload: Record<string, unknown>) {
  switch (actionKey) {
    case 'log_submission':
      console.info('[CMS Form] Internal submission', payload)
      return
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Action interne de formulaire inconnue'
      })
  }
}

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, {
    key: 'cms-form-submit',
    limit: 8,
    windowMs: 15 * 60 * 1000,
    message: 'Trop de formulaires envoyés. Réessayez plus tard.'
  })

  const body = await readBody<FormSubmitBody>(event)
  const locale = body.locale === 'en' ? 'en' : 'fr'
  const pagePath = normalizeCmsPath(body.pagePath || '/', locale)

  if (body.website?.trim()) {
    return { ok: true }
  }

  if (!body.submittedAt || Date.now() - body.submittedAt < 2000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Envoi trop rapide.'
    })
  }

  const featureFlags = await getFeatureFlags()
  const page = await resolvePublicCmsPage(pagePath, locale, false, featureFlags)
  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page CMS introuvable.'
    })
  }

  const form = findFormItem(page.content, body.formId, body.formKey)
  if (!form) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Formulaire introuvable.'
    })
  }

  const values = body.values ?? {}
  const fieldErrors: Record<string, string> = {}
  const fields = getAllFormFields(form)

  for (const field of fields) {
    const error = validateField(locale, field, values[field.name])
    if (error) {
      fieldErrors[field.name] = error
    }
  }

  if (Object.keys(fieldErrors).length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le formulaire contient des erreurs.',
      data: {
        fieldErrors
      }
    })
  }

  const normalizedValues = Object.fromEntries(
    fields.map((field) => [field.name, values[field.name] ?? (field.type === 'checkbox' ? false : '')])
  )

  if (form.action.type === 'email') {
    const authService = new AuthService()
    const currentUser = await authService.getUserFromSession(event)
    const currentUserEmail = currentUser?.email?.trim() || ''
    const replyToValue = form.action.replyToFieldName
      ? normalizedValues[form.action.replyToFieldName]
      : ''
    const replyToEmail = typeof replyToValue === 'string' ? replyToValue.trim() : ''
    const to = form.action.toMode === 'current-user'
      ? currentUserEmail
      : form.action.toMode === 'field'
        ? typeof normalizedValues[form.action.toFieldName] === 'string'
          ? String(normalizedValues[form.action.toFieldName]).trim()
          : ''
        : (form.action.to || await getContactEmail())
    if (!to) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Aucun email de destination n’est configuré pour ce formulaire.'
      })
    }

    const template = await resolveAdminEmailTemplate(form.action.templateAction || 'contact', locale)
    const compiled = applyTemplateVars(
      template,
      buildTemplateVariables(locale, fields, normalizedValues, page, form, replyToEmail, currentUserEmail)
    )

    await sendGmail({
      to,
      subject: compiled.subject,
      cc: parseEmailList(form.action.cc),
      bcc: parseEmailList(form.action.bcc),
      replyTo: replyToEmail || undefined,
      body: compiled.body,
      htmlBody: buildGenericEmail({
        title: compiled.subject,
        body: compiled.body,
        accent: '#2563eb',
        lang: getReservationEmailHtmlLang(locale)
      })
    })
  } else {
    await executeInternalWebhook(form.action.actionKey, {
      pagePath: page.path,
      locale,
      formId: form.id,
      formKey: form.formKey,
      values: normalizedValues
    })
  }

  return {
    ok: true,
    message: pickLocalizedText(locale, form.successMessage) || 'Envoyé.'
  }
})
