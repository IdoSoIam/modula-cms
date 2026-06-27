import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getSiteLocales, getSiteDefaultLocale } from '#modula/server/utils/settings'
import { db } from '#modula/server/data/client'
import { translateRegistryTexts } from '#modula/server/utils/cmsRegistry'
import { clonePageBuilderContent } from '#modula/shared/pageBuilder'

interface PageTranslation {
  title?: string
  navigationLabel?: string
  seo?: { metaTitle?: string; metaDescription?: string; ogImage?: string; noindex?: boolean }
  content?: unknown
}

interface EventTranslationData {
  title?: string
  subtitle?: string
  excerpt?: string
  content?: unknown
}

interface NavigationLabelsData {
  [locale: string]: string | null | undefined
}

interface TranslationTask {
  kind: 'cmsPage' | 'event' | 'navigationItem'
  id: number
  sourceText: string
  sourceLocale: string
  targetLocale: string
  fieldPath: string
  recordLabel: string
  contentPath?: Array<string | number>
}

interface TranslationResultItem {
  kind: 'cmsPage' | 'event' | 'navigationItem'
  id: number
  recordLabel: string
  fieldPath: string
  sourceLocale: string
  targetLocale: string
  sourceText: string
  translatedText: string
  status: 'translated' | 'cached'
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [siteLocales, siteDefaultLocale] = await Promise.all([
    getSiteLocales(),
    getSiteDefaultLocale()
  ])

  if (siteLocales.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'At least 2 locales required for translation' })
  }

  const defaultLocale = siteDefaultLocale || siteLocales[0]!
  if (!defaultLocale) {
    throw createError({ statusCode: 400, statusMessage: 'No default locale configured' })
  }

  const targetLocales = siteLocales.filter(locale => locale !== defaultLocale)
  const tasks: TranslationTask[] = []

  const pages = await db.cmsPage.findMany()
  for (const row of pages) {
    let translations: Record<string, PageTranslation>
    try {
      translations = JSON.parse(row.translationsJson)
    } catch {
      continue
    }

    const source = translations[defaultLocale]
    if (!source) continue

    for (const targetLocale of targetLocales) {
      const target = translations[targetLocale] || {}
      const recordLabel = source.title?.trim() || row.title?.trim() || row.slug?.trim() || row.path
      if (source.title && !target.title) tasks.push({ kind: 'cmsPage', id: row.id, recordLabel, sourceText: source.title, sourceLocale: defaultLocale, targetLocale, fieldPath: 'title' })
      if (source.navigationLabel && !target.navigationLabel) tasks.push({ kind: 'cmsPage', id: row.id, recordLabel, sourceText: source.navigationLabel, sourceLocale: defaultLocale, targetLocale, fieldPath: 'navigationLabel' })
      if (source.seo?.metaTitle && !target.seo?.metaTitle) tasks.push({ kind: 'cmsPage', id: row.id, recordLabel, sourceText: source.seo.metaTitle, sourceLocale: defaultLocale, targetLocale, fieldPath: 'seo.metaTitle' })
      if (source.seo?.metaDescription && !target.seo?.metaDescription) tasks.push({ kind: 'cmsPage', id: row.id, recordLabel, sourceText: source.seo.metaDescription, sourceLocale: defaultLocale, targetLocale, fieldPath: 'seo.metaDescription' })
      collectLocalizedContentTasks({
        tasks,
        kind: 'cmsPage',
        id: row.id,
        recordLabel,
        sourceLocale: defaultLocale,
        targetLocale,
        content: source.content
      })
    }
  }

  const events = await db.event.findMany()
  for (const row of events) {
    let translations: Record<string, EventTranslationData>
    try {
      translations = JSON.parse(row.translationsJson)
    } catch {
      continue
    }

    const source = translations[defaultLocale]
    if (!source) continue

    for (const targetLocale of targetLocales) {
      const target = translations[targetLocale] || {}
      const recordLabel = source.title?.trim() || row.slug?.trim() || `event-${row.id}`
      if (source.title && !target.title) tasks.push({ kind: 'event', id: row.id, recordLabel, sourceText: source.title, sourceLocale: defaultLocale, targetLocale, fieldPath: 'title' })
      if (source.subtitle && !target.subtitle) tasks.push({ kind: 'event', id: row.id, recordLabel, sourceText: source.subtitle, sourceLocale: defaultLocale, targetLocale, fieldPath: 'subtitle' })
      if (source.excerpt && !target.excerpt) tasks.push({ kind: 'event', id: row.id, recordLabel, sourceText: source.excerpt, sourceLocale: defaultLocale, targetLocale, fieldPath: 'excerpt' })
      collectLocalizedContentTasks({
        tasks,
        kind: 'event',
        id: row.id,
        recordLabel,
        sourceLocale: defaultLocale,
        targetLocale,
        content: source.content
      })
    }
  }

  const navigationItems = await db.cmsNavigationItem.findMany()
  for (const row of navigationItems) {
    let labels: NavigationLabelsData
    try {
      labels = JSON.parse(row.labelsJson)
    } catch {
      continue
    }

    const sourceText = typeof labels[defaultLocale] === 'string' ? labels[defaultLocale]?.trim() : ''
    if (!sourceText) continue

    for (const targetLocale of targetLocales) {
      const existing = typeof labels[targetLocale] === 'string' ? labels[targetLocale]?.trim() : ''
      if (existing) continue
      tasks.push({
        kind: 'navigationItem',
        id: row.id,
        recordLabel: sourceText || row.title?.trim() || row.href,
        sourceText,
        sourceLocale: defaultLocale,
        targetLocale,
        fieldPath: 'label'
      })
    }
  }

  if (!tasks.length) {
    return {
      translated: 0,
      cached: 0,
      totalTasks: 0,
      items: [] satisfies TranslationResultItem[]
    }
  }

  const BATCH_SIZE = 25
  let translated = 0
  let cached = 0
  const items: TranslationResultItem[] = []

  for (let index = 0; index < tasks.length; index += BATCH_SIZE) {
    const batch = tasks.slice(index, index + BATCH_SIZE)
    const response = await translateRegistryTexts(batch.map(task => ({
      text: task.sourceText,
      sourceLocale: task.sourceLocale,
      targetLocale: task.targetLocale
    })))

    const translatedByKey = new Map(
      response.items.map(item => [
        `${item.sourceLocale}::${item.targetLocale}::${item.sourceText}`,
        item
      ])
    )

    for (const task of batch) {
      const result = translatedByKey.get(`${task.sourceLocale}::${task.targetLocale}::${task.sourceText}`)
      if (!result?.translatedText) continue
      await writeTranslation(task, result.translatedText)
      const status = result.cached ? 'cached' : 'translated'
      if (status === 'cached') {
        cached += 1
      } else {
        translated += 1
      }
      items.push({
        kind: task.kind,
        id: task.id,
        recordLabel: task.recordLabel,
        fieldPath: task.fieldPath,
        sourceLocale: task.sourceLocale,
        targetLocale: task.targetLocale,
        sourceText: task.sourceText,
        translatedText: result.translatedText,
        status
      })
    }
  }

  return {
    translated,
    cached,
    totalTasks: tasks.length,
    items
  }
})

async function writeTranslation(task: TranslationTask, translatedText: string) {
  if (task.kind === 'cmsPage') {
    const row = await db.cmsPage.findUnique({ where: { id: task.id } })
    if (!row) return

    let translations: Record<string, PageTranslation>
    try {
      translations = JSON.parse(row.translationsJson)
    } catch {
      return
    }

    const target = translations[task.targetLocale] || {
      title: '',
      navigationLabel: '',
      seo: { metaTitle: '', metaDescription: '', ogImage: '', noindex: false }
    }

    if (task.fieldPath === 'title') target.title = translatedText
    else if (task.fieldPath === 'navigationLabel') target.navigationLabel = translatedText
    else if (task.fieldPath === 'seo.metaTitle') {
      if (!target.seo) target.seo = { metaTitle: '', metaDescription: '', ogImage: '', noindex: false }
      target.seo.metaTitle = translatedText
    } else if (task.fieldPath === 'seo.metaDescription') {
      if (!target.seo) target.seo = { metaTitle: '', metaDescription: '', ogImage: '', noindex: false }
      target.seo.metaDescription = translatedText
    } else if (task.fieldPath.startsWith('content.') && task.contentPath?.length) {
      if (!target.content) {
        target.content = cloneContent(translations[task.sourceLocale]?.content)
      }
      const localizedNode = getNestedValue(target.content, task.contentPath)
      if (isLocalizedTextNode(localizedNode, task.sourceLocale)) {
        localizedNode[task.targetLocale] = translatedText
      }
    }

    translations[task.targetLocale] = target
    await db.cmsPage.update({
      where: { id: task.id },
      data: { translationsJson: JSON.stringify(translations) }
    })
    return
  }

  if (task.kind === 'navigationItem') {
    const row = await db.cmsNavigationItem.findUnique({ where: { id: task.id } })
    if (!row) return

    let labels: NavigationLabelsData
    try {
      labels = JSON.parse(row.labelsJson)
    } catch {
      return
    }

    labels[task.targetLocale] = translatedText
    await db.cmsNavigationItem.update({
      where: { id: task.id },
      data: { labelsJson: JSON.stringify(labels) }
    })
    return
  }

  const row = await db.event.findUnique({ where: { id: task.id } })
  if (!row) return

  let translations: Record<string, EventTranslationData>
  try {
    translations = JSON.parse(row.translationsJson)
  } catch {
    return
  }

  const target = translations[task.targetLocale] || { title: '', subtitle: '', excerpt: '' }
  if (task.fieldPath === 'title') target.title = translatedText
  else if (task.fieldPath === 'subtitle') target.subtitle = translatedText
  else if (task.fieldPath === 'excerpt') target.excerpt = translatedText
  else if (task.fieldPath.startsWith('content.') && task.contentPath?.length) {
    if (!target.content) {
      target.content = cloneContent(translations[task.sourceLocale]?.content)
    }
    const localizedNode = getNestedValue(target.content, task.contentPath)
    if (isLocalizedTextNode(localizedNode, task.sourceLocale)) {
      localizedNode[task.targetLocale] = translatedText
    }
  }

  translations[task.targetLocale] = target
  await db.event.update({
    where: { id: task.id },
    data: { translationsJson: JSON.stringify(translations) }
  })
}

function collectLocalizedContentTasks(input: {
  tasks: TranslationTask[]
  kind: 'cmsPage' | 'event'
  id: number
  recordLabel: string
  sourceLocale: string
  targetLocale: string
  content: unknown
}) {
  walkLocalizedContent(input.content, input.sourceLocale, (node, path) => {
    const sourceText = node[input.sourceLocale]?.trim()
    if (!sourceText) return
    const existing = node[input.targetLocale]
    if (typeof existing === 'string' && existing.trim()) return

    input.tasks.push({
      kind: input.kind,
      id: input.id,
      recordLabel: input.recordLabel,
      sourceText,
      sourceLocale: input.sourceLocale,
      targetLocale: input.targetLocale,
      fieldPath: `content.${pathToFieldPath(path)}`,
      contentPath: path
    })
  })
}

function walkLocalizedContent(
  value: unknown,
  sourceLocale: string,
  onMatch: (node: Record<string, string>, path: Array<string | number>) => void,
  path: Array<string | number> = []
) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkLocalizedContent(entry, sourceLocale, onMatch, [...path, index]))
    return
  }

  if (!value || typeof value !== 'object') {
    return
  }

  if (isLocalizedTextNode(value, sourceLocale)) {
    onMatch(value as Record<string, string>, path)
    return
  }

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    walkLocalizedContent(entry, sourceLocale, onMatch, [...path, key])
  }
}

function isLocalizedTextNode(value: unknown, sourceLocale: string): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  if (typeof record[sourceLocale] !== 'string') return false
  const values = Object.values(record)
  return values.length > 0 && values.every((entry) => typeof entry === 'string')
}

function pathToFieldPath(path: Array<string | number>) {
  return path
    .map((segment) => typeof segment === 'number' ? `[${segment}]` : segment)
    .join('.')
    .replace(/\.\[/g, '[')
}

function getNestedValue(root: unknown, path: Array<string | number>) {
  let current: any = root
  for (const segment of path) {
    if (current == null) return null
    current = current[segment as any]
  }
  return current
}

function cloneContent<T>(value: T): T {
  if (value == null) return value
  try {
    return clonePageBuilderContent(value as any) as T
  } catch {
    return JSON.parse(JSON.stringify(value)) as T
  }
}
