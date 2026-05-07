<template>
  <HomePageEditable :editable="editable" label="Section" @edit="emit('edit', { kind: 'section', label: `Section ${section.id}`, section })">
  <section class="py-12 md:py-16" :class="sectionToneClass" :style="sectionStyle">
    <div class="mx-auto w-full px-4 sm:px-6 lg:px-8" :class="containerWidthClass">
      <div :class="getColumnVerticalAlignClass()">
        <button
          v-if="editable"
          type="button"
          class="absolute right-2 top-2 z-20 cursor-pointer rounded-full border border-base-300 bg-base-100/85 px-2 py-1 text-[11px] font-medium text-primary shadow-sm transition hover:border-primary"
          @click.stop="emit('edit', { kind: 'column', label: 'Colonne', column: section.column })"
        >
          Colonne
        </button>
        <template v-if="section.column.type === 'image'">
          <div :class="[imageAspectClass(section.column.aspect), imageFrameClass(section.column)]">
              <img
                v-if="section.column.imageUrl"
                :src="section.column.imageUrl"
                :alt="pickLocalizedText(locale, section.column.alt)"
                class="h-full w-full"
                :class="section.column.fit === 'contain' ? 'object-contain p-6' : 'object-cover'"
              />
            </div>
        </template>

        <template v-else>
          <div class="space-y-5" :class="contentAlignClass(section.column.align)" :style="columnTextStyle(section.column)">
            <template v-if="hasColumnHeaderContent(section.column)">
              <HomePageEditable v-if="pickLocalizedText(locale, section.column.badge)" :editable="editable" label="Texte" @edit="emit('edit', { kind: 'text', label: 'Badge', text: section.column.badge })">
              <div class="badge badge-primary badge-outline">
                {{ pickLocalizedText(locale, section.column.badge) }}
              </div>
              </HomePageEditable>

              <HomePageEditable v-if="pickLocalizedText(locale, section.column.title)" :editable="editable" label="Texte" @edit="emit('edit', { kind: 'text', label: 'Titre', text: section.column.title })">
              <h2 class="text-3xl font-bold">
                {{ pickLocalizedText(locale, section.column.title) }}
              </h2>
              </HomePageEditable>

              <HomePageEditable v-if="pickLocalizedText(locale, section.column.text)" :editable="editable" label="Texte" @edit="emit('edit', { kind: 'text', label: 'Texte', text: section.column.text, multiline: true })">
              <p class="text-base opacity-80 md:text-lg">
                {{ pickLocalizedText(locale, section.column.text) }}
              </p>
              </HomePageEditable>
            </template>

            <div v-if="section.column.cards.length" :class="cardsContainerClass(section.column.cards, section.column.align)">
              <HomePageEditable
                v-for="card in section.column.cards"
                :key="card.id"
                :editable="editable"
                label="Carte"
                @edit="emit('edit', { kind: 'card', label: 'Carte', card })"
              >
              <div
                class="rounded-2xl border shadow-sm"
                :class="[cardClass(card), cardSizeClass(card, section.column.cards.length)]"
                :style="cardStyle(card)"
              >
                <div v-if="card.icon" class="mb-3 w-fit rounded-xl p-3" :style="iconWrapperStyle(card)">
                  <Icon :name="card.icon" size="22" />
                </div>

                <div class="font-semibold" :style="textColorStyle(card.textColor)">
                  {{ pickLocalizedText(locale, card.title) }}
                </div>

                <p class="mt-2 text-sm" :style="textColorStyle(card.textColor, 0.78)">
                  {{ pickLocalizedText(locale, card.text) }}
                </p>

                <div v-if="primaryCardButton(card) || secondaryCardButton(card)" class="mt-4 flex flex-wrap gap-2">
                  <HomePageEditable
                    v-if="primaryCardButton(card)"
                    inline
                    :editable="editable"
                    label="Bouton"
                    @edit="emit('edit', { kind: 'button', label: 'Bouton principal carte', button: primaryCardButton(card)! })"
                  >
                    <NuxtLink
                      :to="localePath(primaryCardButton(card)!.href)"
                      class="btn btn-sm"
                      :class="buttonClass(primaryCardButton(card)!.tone)"
                      :style="buttonStyle(primaryCardButton(card)!)"
                    >
                      {{ pickLocalizedText(locale, primaryCardButton(card)!.label) }}
                    </NuxtLink>
                  </HomePageEditable>

                  <HomePageEditable
                    v-if="secondaryCardButton(card)"
                    inline
                    :editable="editable"
                    label="Bouton"
                    @edit="emit('edit', { kind: 'button', label: 'Bouton secondaire carte', button: secondaryCardButton(card)! })"
                  >
                    <NuxtLink
                      :to="localePath(secondaryCardButton(card)!.href)"
                      class="btn btn-sm"
                      :class="buttonClass(secondaryCardButton(card)!.tone)"
                      :style="buttonStyle(secondaryCardButton(card)!)"
                    >
                      {{ pickLocalizedText(locale, secondaryCardButton(card)!.label) }}
                    </NuxtLink>
                  </HomePageEditable>
                </div>
              </div>
              </HomePageEditable>
            </div>

            <div v-if="primaryColumnButton(section.column) || secondaryColumnButton(section.column)" class="flex flex-wrap gap-3 pt-2">
              <HomePageEditable v-if="primaryColumnButton(section.column)" inline :editable="editable" label="Bouton" @edit="emit('edit', { kind: 'button', label: 'Bouton principal', button: primaryColumnButton(section.column)! })">
              <NuxtLink
                v-if="primaryColumnButton(section.column)"
                :to="localePath(primaryColumnButton(section.column)!.href)"
                class="btn"
                :class="buttonClass(primaryColumnButton(section.column)!.tone)"
                :style="buttonStyle(primaryColumnButton(section.column)!)"
              >
                {{ pickLocalizedText(locale, primaryColumnButton(section.column)!.label) }}
              </NuxtLink>
              </HomePageEditable>

              <HomePageEditable v-if="secondaryColumnButton(section.column)" inline :editable="editable" label="Bouton" @edit="emit('edit', { kind: 'button', label: 'Bouton secondaire', button: secondaryColumnButton(section.column)! })">
              <NuxtLink
                v-if="secondaryColumnButton(section.column)"
                :to="localePath(secondaryColumnButton(section.column)!.href)"
                class="btn"
                :class="buttonClass(secondaryColumnButton(section.column)!.tone)"
                :style="buttonStyle(secondaryColumnButton(section.column)!)"
              >
                {{ pickLocalizedText(locale, secondaryColumnButton(section.column)!.label) }}
              </NuxtLink>
              </HomePageEditable>
            </div>
          </div>
        </template>
      </div>
    </div>
  </section>
  </HomePageEditable>
</template>

<script setup lang="ts">
import type { HomePageButton, HomePageCard, HomePageContentBlock, HomePageOneColumnSection, ThemeColorSelection } from '~/shared/homePage'
import type { HomePageEditTarget } from '~/shared/homePageEditor'
import HomePageEditable from '~/components/homepage/HomePageEditable.vue'
import { createThemeColorSelection, pickLocalizedText } from '~/shared/homePage'

const props = defineProps<{
  section: HomePageOneColumnSection
  locale: string
  editable?: boolean
}>()

const emit = defineEmits<{
  edit: [target: HomePageEditTarget]
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

const containerWidthClass = computed(() => {
  switch (props.section.containerWidth) {
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

const getColumnVerticalAlignClass = () => {
  const column = props.section.column
  if (column.type !== 'content') return 'relative flex min-h-full h-full items-start'
  switch (column.verticalAlign) {
    case 'center':
      return 'relative flex min-h-full h-full items-center'
    case 'end':
      return 'relative flex min-h-full h-full items-end'
    default:
      return 'relative flex min-h-full h-full items-start'
  }
}

const imageAspectClass = (aspect: string) => {
  switch (aspect) {
    case 'square':
      return 'aspect-square'
    case 'portrait':
      return 'aspect-[4/5]'
    default:
      return 'aspect-[16/8]'
  }
}

const imageFrameClass = (column: HomePageOneColumnSection['column'] & { type: 'image' }) =>
  column.framed
    ? 'overflow-hidden rounded-[2rem] border border-base-300 bg-base-100 shadow-sm'
    : 'overflow-hidden rounded-[2rem]'

const contentAlignClass = (align: string) => align === 'center' ? 'mx-auto text-center items-center' : ''

const cardsContainerClass = (cards: HomePageCard[], align: string) => {
  if (cards.length <= 1) {
    const card = cards[0]
    const maxWidthClass = card ? singleCardMaxWidthClass(card.size) : 'max-w-md'
    return align === 'center' ? `mx-auto w-full ${maxWidthClass}` : `w-full ${maxWidthClass}`
  }

  return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
}

const singleCardMaxWidthClass = (size: HomePageCard['size']) => {
  switch (size) {
    case 'sm':
      return 'max-w-sm'
    case 'lg':
      return 'max-w-xl'
    case 'xl':
      return 'max-w-2xl'
    default:
      return 'max-w-md'
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
  if (opacity >= 1) return color
  const percent = Math.max(0, Math.min(100, Math.round(opacity * 100)))
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

const colorToCss = (selection?: ThemeColorSelection | null, opacity = 1) => {
  if (!selection) return ''
  const selectionOpacity = typeof selection.opacity === 'number' ? Math.max(0, Math.min(100, selection.opacity)) / 100 : 1
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

const defaultCardBackground = () => {
  // Si la section est base-200, les cartes sont base-100
  // Si la section est base-100, les cartes sont base-200
  const token = props.section.tone === 'base-200' ? 'base-100' : 'base-200'
  return createThemeColorSelection(token)
}

const cardClass = (card: HomePageCard) => card.backdropBlur ? 'backdrop-blur' : ''

const cardSizeClass = (card: HomePageCard, cardCount: number) => {
  const sizeClass = (() => {
    switch (card.size) {
      case 'sm':
        return 'min-h-[12rem] p-4'
      case 'lg':
        return 'min-h-[16rem] p-6'
      case 'xl':
        return 'min-h-[18rem] p-7'
      default:
        return 'min-h-[14rem] p-5'
    }
  })()

  if (cardCount <= 1) {
    return `${sizeClass} w-full`
  }

  const spanClass = card.size === 'xl' ? 'md:col-span-2 xl:col-span-2' : card.size === 'lg' ? 'md:col-span-2' : ''
  return `${sizeClass} ${spanClass}`.trim()
}

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
