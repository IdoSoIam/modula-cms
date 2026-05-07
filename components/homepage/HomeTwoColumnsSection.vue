<template>
  <section class="py-12 md:py-16" :class="sectionToneClass" :style="sectionStyle">
    <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="grid gap-8 lg:gap-10" :class="gridClass">
        <div v-for="(column, index) in section.columns" :key="`${section.id}-${index}`" :class="getColumnVerticalAlignClass(column)">
          <template v-if="column.type === 'image'">
            <div class="overflow-hidden rounded-[2rem] border border-base-300 bg-base-100 shadow-sm" :class="imageAspectClass(column.aspect)">
              <img
                v-if="column.imageUrl"
                :src="column.imageUrl"
                :alt="pickLocalizedText(locale, column.alt)"
                class="h-full w-full"
                :class="column.fit === 'contain' ? 'object-contain p-6' : 'object-cover'"
              />
            </div>
          </template>

          <template v-else>
            <div class="space-y-5" :class="contentAlignClass(column.align)" :style="columnTextStyle(column)">
              <template v-if="hasColumnHeaderContent(column)">
                <div v-if="pickLocalizedText(locale, column.badge)" class="badge badge-primary badge-outline">
                  {{ pickLocalizedText(locale, column.badge) }}
                </div>

                <h2 v-if="pickLocalizedText(locale, column.title)" class="text-3xl font-bold">
                  {{ pickLocalizedText(locale, column.title) }}
                </h2>

                <p v-if="pickLocalizedText(locale, column.text)" class="text-base opacity-80 md:text-lg">
                  {{ pickLocalizedText(locale, column.text) }}
                </p>
              </template>

              <div v-if="hasAnyCard(column)" :class="cardsContainerClass(column.cards.length, column.align)">
                <div
                  v-for="card in column.cards"
                  :key="card.id"
                  class="rounded-2xl border p-5 shadow-sm"
                  :class="[cardWrapperClass(column.cards.length), cardToneClass(card.tone), cardClass(card)]"
                  :style="cardStyle(card)"
                >
                  <div
                    v-if="card.icon"
                    class="mb-3 w-fit rounded-xl p-3"
                    :style="iconWrapperStyle(card)"
                  >
                    <Icon :name="card.icon" size="22" />
                  </div>

                  <div class="font-semibold" :style="textColorStyle(card.textColor)">
                    {{ pickLocalizedText(locale, card.title) }}
                  </div>

                  <p class="mt-2 text-sm" :style="textColorStyle(card.textColor, 0.78)">
                    {{ pickLocalizedText(locale, card.text) }}
                  </p>

                  <div v-if="primaryCardButton(card) || secondaryCardButton(card)" class="mt-4 flex flex-wrap gap-2">
                    <NuxtLink
                      v-if="primaryCardButton(card)"
                      :to="localePath(primaryCardButton(card)!.href)"
                      class="btn btn-sm"
                      :class="buttonClass(primaryCardButton(card)!.tone)"
                      :style="buttonStyle(primaryCardButton(card)!)"
                    >
                      {{ pickLocalizedText(locale, primaryCardButton(card)!.label) }}
                    </NuxtLink>

                    <NuxtLink
                      v-if="secondaryCardButton(card)"
                      :to="localePath(secondaryCardButton(card)!.href)"
                      class="btn btn-sm"
                      :class="buttonClass(secondaryCardButton(card)!.tone)"
                      :style="buttonStyle(secondaryCardButton(card)!)"
                    >
                      {{ pickLocalizedText(locale, secondaryCardButton(card)!.label) }}
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <div v-if="primaryColumnButton(column) || secondaryColumnButton(column)" class="flex flex-wrap gap-3 pt-2">
                <NuxtLink
                  v-if="primaryColumnButton(column)"
                  :to="localePath(primaryColumnButton(column)!.href)"
                  class="btn"
                  :class="buttonClass(primaryColumnButton(column)!.tone)"
                  :style="buttonStyle(primaryColumnButton(column)!)"
                >
                  {{ pickLocalizedText(locale, primaryColumnButton(column)!.label) }}
                </NuxtLink>

                <NuxtLink
                  v-if="secondaryColumnButton(column)"
                  :to="localePath(secondaryColumnButton(column)!.href)"
                  class="btn"
                  :class="buttonClass(secondaryColumnButton(column)!.tone)"
                  :style="buttonStyle(secondaryColumnButton(column)!)"
                >
                  {{ pickLocalizedText(locale, secondaryColumnButton(column)!.label) }}
                </NuxtLink>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { HomePageButton, HomePageCard, HomePageColumn, HomePageContentBlock, HomePageTwoColumnsSection, ThemeColorSelection } from '~/shared/homePage'
import { createThemeColorSelection, pickLocalizedText } from '~/shared/homePage'

const props = defineProps<{
  section: HomePageTwoColumnsSection
  locale: string
}>()

const localePath = useLocalePath()

const sectionToneClass = computed(() => {
  // Si backgroundColor est défini et non null, utiliser le style personnalisé
  if (props.section.backgroundColor) {
    return ''
  }

  // Sinon utiliser le tone pour l'alternance
  switch (props.section.tone) {
    case 'base-200':
      return 'bg-base-200'
    case 'neutral':
      return 'bg-neutral text-neutral-content'
    default:
      return 'bg-base-100'
  }
})

const sectionStyle = computed(() => {
  const background = colorToCss(props.section.backgroundColor)
  return background ? { backgroundColor: background } : {}
})

const gridClass = computed(() => props.section.reverseOnDesktop ? 'lg:grid-cols-[.9fr_1.1fr]' : 'lg:grid-cols-[1.1fr_.9fr]')

const getColumnVerticalAlignClass = (column: HomePageColumn) => {
  if (column.type !== 'content') return 'flex items-start'
  switch (column.verticalAlign) {
    case 'start':
      return 'flex items-start'
    case 'end':
      return 'flex items-end'
    case 'center':
      return 'flex items-center'
    default:
      return 'flex items-start'
  }
}

const imageAspectClass = (aspect: string) => {
  switch (aspect) {
    case 'square':
      return 'aspect-square'
    case 'portrait':
      return 'aspect-[4/5]'
    default:
      return 'aspect-[16/10]'
  }
}

const contentAlignClass = (align: string) => align === 'center' ? 'text-center items-center' : ''

const cardsContainerClass = (cardCount: number, align: string) => {
  if (cardCount <= 1) {
    return align === 'center' ? 'mx-auto w-full max-w-md' : 'w-full max-w-md'
  }

  return 'grid gap-4 sm:grid-cols-2'
}

const cardWrapperClass = (cardCount: number) => cardCount <= 1 ? 'w-full' : ''

const cardToneClass = (tone: string) => {
  switch (tone) {
    case 'outline':
      return ''
    case 'base':
      return ''
    default:
      return ''
  }
}

const buttonClass = (tone: string) => {
  switch (tone) {
    case 'secondary':
      return 'btn-secondary'
    case 'accent':
      return 'btn-accent'
    case 'neutral':
      return 'btn-neutral'
    case 'outline':
      return 'btn-outline'
    default:
      return 'btn-primary'
  }
}

const hasColumnHeaderContent = (column: HomePageContentBlock) =>
  pickLocalizedText(props.locale, column.badge) ||
  pickLocalizedText(props.locale, column.title) ||
  pickLocalizedText(props.locale, column.text)

const hasAnyCard = (column: HomePageContentBlock) => column.cards.length > 0

const hasButton = (button?: { href?: string | null } | null) => Boolean(button?.href?.trim())

const primaryCardButton = (card: HomePageCard) => hasButton(card.primaryButton) ? card.primaryButton : null
const secondaryCardButton = (card: HomePageCard) => hasButton(card.secondaryButton) ? card.secondaryButton : null
const primaryColumnButton = (column: HomePageContentBlock) => hasButton(column.primaryButton) ? column.primaryButton : null
const secondaryColumnButton = (column: HomePageContentBlock) => hasButton(column.secondaryButton) ? column.secondaryButton : null

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

const cardClass = (card: HomePageCard) => card.backdropBlur ? 'backdrop-blur' : ''

const cardStyle = (card: HomePageCard) => {
  const style: Record<string, string> = {}
  const background = colorToCss(card.backgroundColor || defaultCardBackground())
  const border = colorToCss(card.borderColor)
  const text = colorToCss(card.textColor)

  if (background) style.backgroundColor = background
  if (border) style.borderColor = border
  if (text) style.color = text

  return style
}

const iconWrapperStyle = (card: HomePageCard) => {
  const style: Record<string, string> = {}
  const background = colorToCss(card.iconBackgroundColor)
  const color = colorToCss(card.iconColor)

  if (background) style.backgroundColor = background
  if (color) style.color = color

  return style
}

const defaultCardBackground = () => {
  const token = props.section.backgroundColor?.token === 'base-200' || props.section.tone === 'base-200'
    ? 'base-100'
    : 'base-200'
  return createThemeColorSelection(token)
}

const textColorStyle = (selection?: ThemeColorSelection | null, opacity = 1) => {
  const color = colorToCss(selection, opacity)
  return color ? { color } : {}
}

const columnTextStyle = (column: HomePageContentBlock) => textColorStyle(column.textColor)

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
</script>
