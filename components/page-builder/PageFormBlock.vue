<template>
  <div class="space-y-5 rounded-[1.75rem] border border-base-300 bg-base-100 p-5 shadow-sm" :style="formCardStyle">
    <div v-if="hasIntroContent" class="space-y-2">
      <h3 v-if="localizedTitle" class="text-xl font-semibold">{{ localizedTitle }}</h3>
      <p v-if="localizedIntro" class="text-sm opacity-75">{{ localizedIntro }}</p>
    </div>

    <form class="space-y-5" @submit.prevent="submitForm">
      <input
        v-model="honeypot"
        type="text"
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
        class="pointer-events-none absolute -left-[9999px] top-auto h-px w-px opacity-0"
      >

      <div class="space-y-4">
        <div
          v-for="row in item.rows"
          :key="row.id"
          class="grid gap-4 md:grid-cols-2"
        >
          <div
            v-for="field in row.fields"
            :key="field.id"
            :class="field.width === 2 ? 'md:col-span-2' : ''"
            class="space-y-1.5"
          >
              <label class="block text-sm font-medium" :for="fieldDomId(field)" :style="labelStyle">
                {{ pickLocalizedText(locale, field.label) || field.name }}
                <span v-if="field.required" class="text-error">*</span>
              </label>

              <template v-if="field.type === 'textarea'">
                <textarea
                  :id="fieldDomId(field)"
                  v-model="stringValues[field.name]"
                  class="textarea textarea-bordered w-full"
                  :rows="field.textareaMinLines"
                  :placeholder="pickLocalizedText(locale, field.placeholder)"
                />
              </template>

              <template v-else-if="field.type === 'select'">
                <select
                  :id="fieldDomId(field)"
                  v-model="stringValues[field.name]"
                  class="select select-bordered w-full"
                >
                  <option value="">--</option>
                  <option
                    v-for="option in field.options"
                    :key="option.id"
                    :value="option.value"
                  >
                    {{ pickLocalizedText(locale, option.label) || option.value }}
                  </option>
                </select>
              </template>

              <template v-else-if="field.type === 'radio'">
                <div class="space-y-2 rounded-2xl border border-base-300 bg-base-200/60 p-3">
                  <label
                    v-for="option in field.options"
                    :key="option.id"
                    class="flex items-center gap-3 text-sm"
                  >
                    <input
                      v-model="stringValues[field.name]"
                      type="radio"
                      class="radio radio-primary radio-sm"
                      :name="fieldDomId(field)"
                      :value="option.value"
                    >
                    <span>{{ pickLocalizedText(locale, option.label) || option.value }}</span>
                  </label>
                </div>
              </template>

              <template v-else-if="field.type === 'checkbox'">
                <label class="flex min-h-11 items-start gap-3 rounded-2xl border border-base-300 bg-base-200/60 px-4 py-3 text-sm" :style="labelStyle">
                  <input
                    v-model="booleanValues[field.name]"
                    type="checkbox"
                    class="checkbox checkbox-primary checkbox-sm mt-0.5"
                  >
                  <span>{{ pickLocalizedText(locale, field.helpText) || pickLocalizedText(locale, field.placeholder) || pickLocalizedText(locale, field.label) }}</span>
                </label>
              </template>

              <template v-else>
                <input
                  :id="fieldDomId(field)"
                  v-model="stringValues[field.name]"
                  :type="field.type"
                  class="input input-bordered w-full"
                  :placeholder="pickLocalizedText(locale, field.placeholder)"
                >
              </template>

              <p v-if="field.type !== 'checkbox' && pickLocalizedText(locale, field.helpText)" class="text-xs opacity-65">
                {{ pickLocalizedText(locale, field.helpText) }}
              </p>

              <p v-if="errors[field.name]" class="text-sm text-error">
                {{ errors[field.name] }}
              </p>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3 pt-2">
          <button
            type="submit"
            class="btn w-full md:w-auto"
            :class="buttonToneClass"
            :style="submitButtonStyle"
            :disabled="submitting"
          >
          <span v-if="submitting" class="loading loading-spinner loading-sm" />
          {{ pickLocalizedText(locale, item.submitLabel) || 'Envoyer' }}
        </button>

        <p v-if="submitState === 'success'" class="text-sm text-success">
          {{ pickLocalizedText(locale, item.successMessage) || 'Envoyé.' }}
        </p>
        <p v-else-if="submitError" class="text-sm text-error">
          {{ submitError }}
        </p>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { PageBuilderFormField, PageBuilderFormItem, ThemeColorSelection } from '#modula/shared/pageBuilder'
import { pickLocalizedText } from '#modula/shared/pageBuilder'

const props = defineProps<{
  item: PageBuilderFormItem
  locale: string
}>()

const route = useRoute()
const startedAt = ref<number>(0)
const honeypot = ref('')
const submitting = ref(false)
const submitState = ref<'idle' | 'success'>('idle')
const submitError = ref('')
const errors = ref<Record<string, string>>({})
const stringValues = reactive<Record<string, string>>({})
const booleanValues = reactive<Record<string, boolean>>({})

const localizedTitle = computed(() => pickLocalizedText(props.locale, props.item.title))
const localizedIntro = computed(() => pickLocalizedText(props.locale, props.item.intro))
const hasIntroContent = computed(() => Boolean(localizedTitle.value || localizedIntro.value))
const buttonToneClass = computed(() => `btn-${props.item.submitButtonTone}`)
const formCardStyle = computed(() => {
  const style: Record<string, string> = {}
  const background = colorToCss(props.item.cardBackgroundColor)
  if (background) style.backgroundColor = background
  return style
})
const labelStyle = computed(() => {
  const color = colorToCss(props.item.labelColor)
  return color ? { color } : {}
})
const submitButtonStyle = computed(() => {
  const style: Record<string, string> = {}
  const background = colorToCss(props.item.submitButtonBackgroundColor)
  const color = colorToCss(props.item.submitButtonTextColor)
  const border = colorToCss(props.item.submitButtonBorderColor)
  if (background) style.backgroundColor = background
  if (color) style.color = color
  if (border) style.borderColor = border
  if (background || border) style.boxShadow = 'none'
  return style
})

const allFields = computed(() =>
  props.item.rows.flatMap(row => row.fields)
)

const THEME_COLOR_VARIABLES = {
  'base-100': '--color-base-100',
  'base-200': '--color-base-200',
  'base-300': '--color-base-300',
  'base-content': '--color-base-content',
  primary: '--color-primary',
  'primary-content': '--color-primary-content',
  secondary: '--color-secondary',
  'secondary-content': '--color-secondary-content',
  accent: '--color-accent',
  'accent-content': '--color-accent-content',
  neutral: '--color-neutral',
  'neutral-content': '--color-neutral-content',
  info: '--color-info',
  'info-content': '--color-info-content',
  success: '--color-success',
  'success-content': '--color-success-content',
  warning: '--color-warning',
  'warning-content': '--color-warning-content',
  error: '--color-error',
  'error-content': '--color-error-content'
} as const

function colorToCss(selection?: ThemeColorSelection | null) {
  if (!selection) return ''
  if (selection.token === 'transparent') return 'transparent'
  if (selection.token === 'custom') return selection.customHex || ''
  if (selection.token === 'white') return `rgb(255 255 255 / ${(selection.opacity ?? 100) / 100})`
  if (selection.token === 'white-90') return 'rgb(255 255 255 / 0.9)'
  if (selection.token === 'white-70') return 'rgb(255 255 255 / 0.7)'
  if (selection.token === 'white-10') return 'rgb(255 255 255 / 0.1)'
  const variable = THEME_COLOR_VARIABLES[selection.token as keyof typeof THEME_COLOR_VARIABLES]
  if (!variable) return ''
  return `rgb(from var(${variable}) r g b / ${(selection.opacity ?? 100) / 100})`
}

function initializeValues() {
  for (const field of allFields.value) {
    if (field.type === 'checkbox') {
      booleanValues[field.name] = field.defaultChecked
      continue
    }
    stringValues[field.name] = field.defaultValue || ''
  }
}

function fieldDomId(field: PageBuilderFormField) {
  return `${props.item.id}-${field.name}`
}

function validateField(field: PageBuilderFormField) {
  const label = pickLocalizedText(props.locale, field.label) || field.name
  const customMessage = pickLocalizedText(props.locale, field.errorMessage)

  if (field.type === 'checkbox') {
    const checked = Boolean(booleanValues[field.name])
    if (field.required && !checked) {
      return customMessage || `${label} est requis.`
    }
    return ''
  }

  const value = (stringValues[field.name] || '').trim()
  if (field.required && !value) {
    return customMessage || `${label} est requis.`
  }
  if (!value) return ''

  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return customMessage || `${label} doit être un email valide.`
  }

  if (field.regexPattern) {
    try {
      const pattern = new RegExp(field.regexPattern)
      if (!pattern.test(value)) {
        return customMessage || `${label} n'est pas valide.`
      }
    } catch {
      return ''
    }
  }

  return ''
}

async function submitForm() {
  submitState.value = 'idle'
  submitError.value = ''
  errors.value = {}

  for (const field of allFields.value) {
    const message = validateField(field)
    if (message) {
      errors.value[field.name] = message
    }
  }

  if (Object.keys(errors.value).length) return

  submitting.value = true
  try {
    const values: Record<string, string | boolean> = {}
    for (const field of allFields.value) {
      values[field.name] = field.type === 'checkbox'
        ? Boolean(booleanValues[field.name])
        : (stringValues[field.name] || '')
    }

    await $fetch('/api/forms/submit', {
      method: 'POST',
      body: {
        pagePath: route.path,
        locale: props.locale,
        formId: props.item.id,
        formKey: props.item.formKey,
        website: honeypot.value,
        submittedAt: startedAt.value,
        values
      }
    })

    submitState.value = 'success'
    initializeValues()
    honeypot.value = ''
  } catch (error: any) {
    submitError.value = error?.data?.statusMessage || error?.statusMessage || 'Erreur lors de l’envoi.'
  } finally {
    submitting.value = false
  }
}

initializeValues()

onMounted(() => {
  startedAt.value = Date.now()
})
</script>
