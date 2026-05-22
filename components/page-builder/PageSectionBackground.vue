<template>
  <div class="absolute inset-0 overflow-hidden">
    <template v-if="section.backgroundMode === 'image' && section.backgroundImage.imageUrl">
      <AppImage
        :src="section.backgroundImage.imageUrl"
        :alt="pickLocalizedText(locale, section.backgroundImage.alt)"
        class="h-full w-full"
        :class="mediaClass(section.backgroundImage.fit, section.backgroundImage.verticalAlign)"
        :width="backgroundMediaWidth"
        sizes="100vw"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
      />
      <div
        v-if="overlayStyle"
        class="absolute inset-0"
        :class="section.backgroundImage.blur ? 'md:backdrop-blur-sm' : ''"
        :style="overlayStyle"
      />
    </template>

    <PageMediaCarousel
      v-else-if="section.backgroundMode === 'carousel' && carouselSlides.length"
      :slides="carouselSlides"
      :settings="section.backgroundCarouselSettings"
      :locale="locale"
      :overlay-style="overlayStyle"
      :overlay-blur="section.backgroundImage.blur"
      :priority="priority"
      :base-width="backgroundMediaWidth"
      sizes="100vw"
    />
  </div>
</template>

<script setup lang="ts">
import type { PageBuilderSection, ThemeColorSelection } from '~/shared/pageBuilder'
import { pickLocalizedText } from '~/shared/pageBuilder'
import PageMediaCarousel from '~/components/page-builder/PageMediaCarousel.vue'

const props = defineProps<{
  section: PageBuilderSection
  locale: string
  priority?: boolean
}>()

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
  if (opacity >= 1) return color
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
    case 'transparent': return 'transparent'
    case 'white': return mixColor('#ffffff', finalOpacity)
    case 'white-90': return `rgba(255,255,255,${0.9 * finalOpacity})`
    case 'white-70': return `rgba(255,255,255,${0.7 * finalOpacity})`
    case 'white-10': return `rgba(255,255,255,${0.1 * finalOpacity})`
    case 'custom': return selection.customHex ? mixColor(selection.customHex, finalOpacity) : ''
    default: {
      const variable = THEME_COLOR_VARIABLES[selection.token as keyof typeof THEME_COLOR_VARIABLES]
      return variable ? mixColor(`var(${variable})`, finalOpacity) : ''
    }
  }
}

const overlayStyle = computed(() => {
  const overlayColor = props.section.backgroundImage.overlayColor || { token: 'neutral', opacity: 100 } as ThemeColorSelection
  const opacity = Math.max(0, Math.min(100, props.section.backgroundImage.overlayOpacity)) / 100
  const backgroundColor = colorToCss(overlayColor, opacity)
  return backgroundColor ? { backgroundColor } : null
})

const carouselSlides = computed(() =>
  props.section.backgroundCarousel.filter(slide => slide.imageUrl.trim())
)

const backgroundMediaWidth = computed(() => {
  const explicitWidth = props.section.backgroundImage.requestedWidthPx
  if (typeof explicitWidth === 'number' && Number.isFinite(explicitWidth) && explicitWidth > 0) {
    return Math.min(2400, Math.round(explicitWidth))
  }

  switch (props.section.containerWidth) {
    case 'full':
    case 'edge':
      return 1920
    case 'xwide':
      return 1760
    case 'wide':
      return 1600
    case 'medium':
      return 1480
    case 'default':
      return 1520
    default:
      return 1440
  }
})

const mediaClass = (fit: string, verticalAlign: string) => {
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'
  const alignClass = verticalAlign === 'start'
    ? 'object-top'
    : verticalAlign === 'end'
      ? 'object-bottom'
      : 'object-center'
  return `${fitClass} ${alignClass}`
}
</script>
