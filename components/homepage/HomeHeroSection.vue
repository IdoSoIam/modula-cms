<template>
  <section
    class="hero min-h-[78vh] items-end overflow-hidden"
    :style="heroStyle"
  >
    <div class="hero-content w-full justify-start px-4 py-20 text-neutral-content" :class="heroContainerWidthClass">
      <HomePageEditable :editable="editable" label="Hero" @edit="emit('edit', { kind: 'hero', label: 'Hero', hero: content.hero })">
        <div class="max-w-3xl">
          <HomePageEditable
            v-if="badge"
            inline
            :editable="editable"
            label="Badge"
            button-position="inline-end"
            @edit="emit('edit', { kind: 'text', label: 'Badge du hero', text: content.hero.badge })"
          >
            <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <Icon name="mdi:leaf" size="18" />
              {{ badge }}
            </div>
          </HomePageEditable>

          <HomePageEditable
            inline
            :editable="editable"
            label="Titre"
            @edit="emit('edit', { kind: 'text', label: 'Titre du hero', text: content.hero.title })"
          >
            <h1 class="mb-5 text-5xl font-bold leading-tight md:text-6xl">
              {{ title }}
            </h1>
          </HomePageEditable>
          <HomePageEditable
            v-if="text"
            inline
            :editable="editable"
            label="Texte"
            @edit="emit('edit', { kind: 'text', label: 'Texte du hero', text: content.hero.text, multiline: true })"
          >
            <p class="mb-6 max-w-2xl text-lg text-white/90 md:text-xl">
              {{ text }}
            </p>
          </HomePageEditable>

          <div class="flex flex-wrap gap-3">
            <HomePageEditable
              v-if="content.hero.primaryButton?.href"
              inline
              :editable="editable"
              label="Bouton"
              @edit="emit('edit', { kind: 'button', label: 'Bouton principal du hero', button: content.hero.primaryButton })"
            >
              <NuxtLink
                :to="localePath(content.hero.primaryButton.href)"
                class="btn btn-lg"
                :class="buttonClass(content.hero.primaryButton.tone)"
                :style="buttonStyle(content.hero.primaryButton)"
              >
                {{ pickLocalizedText(locale, content.hero.primaryButton.label) }}
              </NuxtLink>
            </HomePageEditable>
            <HomePageEditable
              v-if="content.hero.secondaryButton?.href"
              inline
              :editable="editable"
              label="Bouton"
              @edit="emit('edit', { kind: 'button', label: 'Bouton secondaire du hero', button: content.hero.secondaryButton })"
            >
              <NuxtLink
                :to="localePath(content.hero.secondaryButton.href)"
                class="btn btn-lg"
                :class="buttonClass(content.hero.secondaryButton.tone)"
                :style="buttonStyle(content.hero.secondaryButton)"
              >
                {{ pickLocalizedText(locale, content.hero.secondaryButton.label) }}
              </NuxtLink>
            </HomePageEditable>
          </div>

          <div v-if="content.hero.highlights.length" :class="highlightsGridClass">
            <HomePageEditable
              v-for="highlight in content.hero.highlights"
              :key="highlight.id"
              :editable="editable"
              label="Carte"
              @edit="emit('edit', { kind: 'card', label: 'Carte du hero', card: highlight })"
            >
              <div
                class="rounded-2xl p-4"
                :class="highlight.backdropBlur ? 'backdrop-blur' : ''"
                :style="highlightStyle(highlight)"
              >
                <div v-if="highlight.icon" class="mb-3 w-fit rounded-xl p-3" :style="iconWrapperStyle(highlight)">
                  <Icon :name="highlight.icon" size="22" />
                </div>
                <div class="text-xs uppercase tracking-[0.18em]" :style="textColorStyle(highlight.textColor, 0.72)">{{ pickLocalizedText(locale, highlight.title) }}</div>
                <div class="mt-2 text-sm" :style="textColorStyle(highlight.textColor)">{{ pickLocalizedText(locale, highlight.text) }}</div>

                <div v-if="primaryHighlightButton(highlight) || secondaryHighlightButton(highlight)" class="mt-3 flex flex-wrap gap-2">
                  <NuxtLink
                    v-if="primaryHighlightButton(highlight)"
                    :to="localePath(primaryHighlightButton(highlight)!.href)"
                    class="btn btn-xs"
                    :class="buttonClass(primaryHighlightButton(highlight)!.tone)"
                    :style="buttonStyle(primaryHighlightButton(highlight)!)"
                  >
                    {{ pickLocalizedText(locale, primaryHighlightButton(highlight)!.label) }}
                  </NuxtLink>
                  <NuxtLink
                    v-if="secondaryHighlightButton(highlight)"
                    :to="localePath(secondaryHighlightButton(highlight)!.href)"
                    class="btn btn-xs"
                    :class="buttonClass(secondaryHighlightButton(highlight)!.tone)"
                    :style="buttonStyle(secondaryHighlightButton(highlight)!)"
                  >
                    {{ pickLocalizedText(locale, secondaryHighlightButton(highlight)!.label) }}
                  </NuxtLink>
                </div>
              </div>
            </HomePageEditable>
          </div>
        </div>
      </HomePageEditable>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { HomePageButton, HomePageCard, HomePageContent, ThemeColorSelection } from '~/shared/homePage'
import type { HomePageEditTarget } from '~/shared/homePageEditor'
import HomePageEditable from '~/components/homepage/HomePageEditable.vue'
import { pickLocalizedText } from '~/shared/homePage'

const props = defineProps<{
  content: HomePageContent
  locale: string
  editable?: boolean
}>()

const emit = defineEmits<{
  edit: [target: HomePageEditTarget]
}>()

const localePath = useLocalePath()

const badge = computed(() => pickLocalizedText(props.locale, props.content.hero.badge))
const title = computed(() => pickLocalizedText(props.locale, props.content.hero.title))
const text = computed(() => pickLocalizedText(props.locale, props.content.hero.text))

const heroStyle = computed(() => {
  const background = props.content.hero.backgroundImageUrl || '/images/plaquette.jpg'
  return `background-image: linear-gradient(120deg, rgba(19,33,17,.68), rgba(19,33,17,.34)), url('${background}'); background-position:center; background-size:cover;`
})

const heroContainerWidthClass = computed(() => {
  switch (props.content.hero.containerWidth) {
    case 'narrow':
      return 'max-w-4xl'
    case 'wide':
      return 'max-w-7xl'
    case 'full':
      return 'max-w-none'
    default:
      return 'max-w-6xl'
  }
})

const buttonClass = (tone: string) => {
  switch (tone) {
    case 'secondary':
      return 'btn-secondary'
    case 'accent':
      return 'btn-accent'
    case 'neutral':
      return 'btn-neutral'
    case 'outline':
      return 'btn-outline text-white hover:text-base-content'
    default:
      return 'btn-primary'
  }
}

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

const mixColor = (color: string, opacity: number) => {
  if (opacity >= 1) {
    return color
  }

  const percent = Math.max(0, Math.min(100, Math.round(opacity * 100)))
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

const colorToCss = (selection?: ThemeColorSelection | null, opacity = 1) => {
  if (!selection) return ''
  const selectionOpacity = typeof selection.opacity === 'number'
    ? Math.max(0, Math.min(100, selection.opacity)) / 100
    : 1
  const finalOpacity = opacity * selectionOpacity

  switch (selection.token) {
    case 'transparent':
      return 'transparent'
    case 'white':
      return mixColor('#ffffff', finalOpacity)
    case 'white-90':
      return `rgba(255,255,255,${0.9 * finalOpacity})`
    case 'white-70':
      return `rgba(255,255,255,${0.7 * finalOpacity})`
    case 'white-10':
      return `rgba(255,255,255,${0.1 * finalOpacity})`
    case 'custom':
      return selection.customHex ? mixColor(selection.customHex, finalOpacity) : ''
    default: {
      const variable = THEME_COLOR_VARIABLES[selection.token as keyof typeof THEME_COLOR_VARIABLES]
      return variable ? mixColor(`var(${variable})`, finalOpacity) : ''
    }
  }
}

const buttonStyle = (button: HomePageButton) => {
  const style: Record<string, string> = {}
  const background = colorToCss(button.backgroundColor)
  const color = colorToCss(button.textColor)
  const border = colorToCss(button.borderColor)
  if (background) style.backgroundColor = background
  if (color) style.color = color
  if (border) style.borderColor = border
  if (background || border) style.boxShadow = 'none'
  return style
}

const highlightsGridClass = computed(() => props.content.hero.highlights.length === 1
  ? 'mt-8 max-w-md'
  : 'mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3')

const highlightStyle = (highlight: HomePageCard) => {
  const style: Record<string, string> = {}
  const background = colorToCss(highlight.backgroundColor) || 'rgba(255,255,255,.1)'
  const border = colorToCss(highlight.borderColor)
  const color = colorToCss(highlight.textColor)

  style.backgroundColor = background
  if (border) style.borderColor = border
  if (color) style.color = color

  return style
}

const iconWrapperStyle = (highlight: HomePageCard) => {
  const style: Record<string, string> = {}
  const background = colorToCss(highlight.iconBackgroundColor) || 'rgba(255,255,255,.1)'
  const color = colorToCss(highlight.iconColor) || '#ffffff'
  style.backgroundColor = background
  style.color = color
  return style
}

const textColorStyle = (selection?: ThemeColorSelection | null, opacity = 1) => {
  const color = colorToCss(selection, opacity)
  return color ? { color } : {}
}

const hasButton = (button?: { href?: string | null } | null) => Boolean(button?.href?.trim())
const primaryHighlightButton = (highlight: HomePageCard) => hasButton(highlight.primaryButton) ? highlight.primaryButton : null
const secondaryHighlightButton = (highlight: HomePageCard) => hasButton(highlight.secondaryButton) ? highlight.secondaryButton : null
</script>
