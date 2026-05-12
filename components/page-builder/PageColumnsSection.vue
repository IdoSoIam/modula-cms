<template>
  <PageEditable
    :editable="editable"
    label="Section"
    @edit="emit('edit', { kind: 'section', label: `Section ${section.id}`, section, sections, sectionIndex })"
  >
    <section class="relative overflow-hidden py-12 md:py-16" :class="sectionToneClass" :style="sectionStyle">
      <PageSectionBackground
        v-if="hasBackgroundMedia"
        :section="section"
        :locale="locale"
      />

      <div class="relative z-10 mx-auto flex w-full flex-col px-4 sm:px-6 lg:px-8" :class="containerWidthClass" :style="contentFrameStyle">
        <div class="grid flex-1 gap-8 lg:gap-10" :class="[gridClass, sectionContentVerticalAlignClass]">
          <div
            v-for="(column, columnIndex) in normalizedColumns"
            :key="`${section.id}-${columnIndex}`"
            class="relative flex w-full"
          >
            <PageEditable
              :editable="editable"
              label="Colonne"
              button-position="top-center-outside"
              @edit="emit('edit', { kind: 'column', label: `Colonne ${columnIndex + 1}`, column, section, columnIndex })"
            >
            <div class="flex min-h-full w-full flex-col gap-5" :class="[contentAlignClass(column.align), columnJustifyClass(column.verticalAlign)]" :style="columnTextStyle(column)">
              <template v-for="(item, itemIndex) in column.items" :key="item.id">
                <PageEditable
                  v-if="item.type === 'badge' && (editable || hasLocalizedText(item.text))"
                  inline
                  :editable="editable"
                  label="Badge"
                  button-position="inline-end"
                  @edit="emit('edit', { kind: 'item', label: `Badge colonne ${columnIndex + 1}`, item, parentItems: column.items, itemIndex })"
                >
                  <div class="badge badge-outline" :class="badgeSizeClass(item.size)" :style="badgeStyle(item)">
                    {{ pickLocalizedText(locale, item.text) || 'Badge vide' }}
                  </div>
                </PageEditable>

                <PageEditable
                  v-else-if="item.type === 'title' && (editable || hasLocalizedText(item.text))"
                  :editable="editable"
                  label="Titre"
                  @edit="emit('edit', { kind: 'item', label: `Titre colonne ${columnIndex + 1}`, item, parentItems: column.items, itemIndex })"
                >
                  <h2 class="font-bold" :class="titleSizeClass(item.size)">
                    {{ pickLocalizedText(locale, item.text) || 'Titre vide' }}
                  </h2>
                </PageEditable>

                <PageEditable
                  v-else-if="item.type === 'text' && (editable || hasLocalizedText(item.text))"
                  :editable="editable"
                  label="Texte"
                  @edit="emit('edit', { kind: 'item', label: `Texte colonne ${columnIndex + 1}`, item, parentItems: column.items, itemIndex })"
                >
                  <p class="opacity-80" :class="textSizeClass(item.size)">
                    {{ pickLocalizedText(locale, item.text) || 'Texte vide' }}
                  </p>
                </PageEditable>

                <PageEditable
                  v-else-if="item.type === 'buttons' && (editable || hasButton(item.primaryButton) || hasButton(item.secondaryButton))"
                  :editable="editable"
                  label="Boutons"
                  button-position="top-left"
                  @edit="emit('edit', { kind: 'item', label: `Boutons colonne ${columnIndex + 1}`, item, parentItems: column.items, itemIndex })"
                >
                  <div class="flex flex-wrap gap-3 pt-1">
                    <PageEditable
                      v-if="hasButton(item.primaryButton)"
                      inline
                      :editable="editable"
                      label="Bouton"
                      button-position="below-center"
                      @edit="emit('edit', { kind: 'button', label: `Bouton principal colonne ${columnIndex + 1}`, button: item.primaryButton! })"
                    >
                      <NuxtLink
                        :to="localePath(item.primaryButton!.href)"
                        class="btn"
                        :class="[buttonClass(item.primaryButton!.tone), buttonSizeClass(item.primaryButton!.size)]"
                        :style="buttonStyle(item.primaryButton!)"
                      >
                        {{ pickLocalizedText(locale, item.primaryButton!.label) }}
                      </NuxtLink>
                    </PageEditable>
                    <PageEditable
                      v-if="hasButton(item.secondaryButton)"
                      inline
                      :editable="editable"
                      label="Bouton"
                      button-position="below-center"
                      @edit="emit('edit', { kind: 'button', label: `Bouton secondaire colonne ${columnIndex + 1}`, button: item.secondaryButton! })"
                    >
                      <NuxtLink
                        :to="localePath(item.secondaryButton!.href)"
                        class="btn"
                        :class="[buttonClass(item.secondaryButton!.tone), buttonSizeClass(item.secondaryButton!.size)]"
                        :style="buttonStyle(item.secondaryButton!)"
                      >
                        {{ pickLocalizedText(locale, item.secondaryButton!.label) }}
                      </NuxtLink>
                    </PageEditable>
                    <div v-if="editable && !hasButton(item.primaryButton) && !hasButton(item.secondaryButton)" class="rounded-2xl border border-dashed border-primary/40 px-4 py-3 text-sm opacity-60">
                      Aucun bouton configure
                    </div>
                  </div>
                </PageEditable>

                <PageEditable
                  v-else-if="item.type === 'image' && (editable || item.imageUrl)"
                  :editable="editable"
                  label="Image"
                  @edit="emit('edit', { kind: 'item', label: `Image colonne ${columnIndex + 1}`, item, parentItems: column.items, itemIndex })"
                >
                  <div class="w-full" :class="[imageAspectClass(item.aspect), imageFrameClass(item), !item.imageUrl ? 'grid place-items-center border-dashed' : '']">
                    <template v-if="item.imageUrl">
                    <img
                      :src="item.imageUrl"
                      :alt="pickLocalizedText(locale, item.alt)"
                      class="h-full w-full"
                      :class="imageClass(item)"
                    />
                    </template>
                    <div v-else class="px-4 text-sm opacity-60">Image vide</div>
                  </div>
                </PageEditable>

                <PageEditable
                  v-else-if="item.type === 'cards' && (editable || item.cards.length)"
                  :editable="editable"
                  label="Cartes"
                  button-position="top-left"
                  @edit="emit('edit', { kind: 'item', label: `Cartes colonne ${columnIndex + 1}`, item, parentItems: column.items, itemIndex })"
                >
                  <div :class="cardsContainerClass(item.display)">
                    <PageEditable
                      v-for="(card, cardIndex) in item.cards"
                      :key="card.id"
                      :editable="editable"
                      label="Carte"
                      @edit="emit('edit', { kind: 'card', label: `Carte colonne ${columnIndex + 1}`, card, parentCards: item.cards, cardIndex })"
                    >
                      <div
                        class="rounded-2xl border p-5 shadow-sm"
                        :class="[cardClass(card), cardSizeClass(card, item.display)]"
                        :style="cardStyle(card)"
                      >
                        <div v-if="card.icon" class="mb-3 w-fit rounded-xl p-3" :style="iconWrapperStyle(card)">
                          <Icon :name="card.icon" size="22" />
                        </div>
                        <div class="font-semibold" :class="cardTitleSizeClass(card.titleSize)" :style="textColorStyle(card.textColor)">
                          {{ pickLocalizedText(locale, card.title) }}
                        </div>
                        <p class="mt-2" :class="cardTextSizeClass(card.textSize)" :style="textColorStyle(card.textColor, 0.8)">
                          {{ pickLocalizedText(locale, card.text) }}
                        </p>
                        <div v-if="hasButton(card.primaryButton) || hasButton(card.secondaryButton)" class="mt-4 flex flex-wrap gap-2">
                          <PageEditable
                            v-if="hasButton(card.primaryButton)"
                            inline
                            :editable="editable"
                            label="Bouton"
                            button-position="below-center"
                            @edit="emit('edit', { kind: 'button', label: `Bouton principal carte colonne ${columnIndex + 1}`, button: card.primaryButton! })"
                          >
                            <NuxtLink
                              :to="localePath(card.primaryButton!.href)"
                              class="btn"
                              :class="[buttonClass(card.primaryButton!.tone), buttonSizeClass(card.primaryButton!.size)]"
                              :style="buttonStyle(card.primaryButton!)"
                            >
                              {{ pickLocalizedText(locale, card.primaryButton!.label) }}
                            </NuxtLink>
                          </PageEditable>
                          <PageEditable
                            v-if="hasButton(card.secondaryButton)"
                            inline
                            :editable="editable"
                            label="Bouton"
                            button-position="below-center"
                            @edit="emit('edit', { kind: 'button', label: `Bouton secondaire carte colonne ${columnIndex + 1}`, button: card.secondaryButton! })"
                          >
                            <NuxtLink
                              :to="localePath(card.secondaryButton!.href)"
                              class="btn"
                              :class="[buttonClass(card.secondaryButton!.tone), buttonSizeClass(card.secondaryButton!.size)]"
                              :style="buttonStyle(card.secondaryButton!)"
                            >
                              {{ pickLocalizedText(locale, card.secondaryButton!.label) }}
                            </NuxtLink>
                          </PageEditable>
                        </div>
                      </div>
                    </PageEditable>
                    <div v-if="editable && !item.cards.length" class="rounded-2xl border border-dashed border-primary/40 px-4 py-6 text-sm opacity-60">
                      Aucune carte
                    </div>
                  </div>
                </PageEditable>

                <PageEditable
                  v-else-if="item.type === 'carousel' && (editable || item.slides.some(slide => slide.imageUrl.trim()))"
                  :editable="editable"
                  label="Carousel"
                  button-position="top-left"
                  @edit="emit('edit', { kind: 'item', label: `Carousel colonne ${columnIndex + 1}`, item, parentItems: column.items, itemIndex })"
                >
                  <div class="w-full" :class="[imageAspectClass(item.aspect), imageFrameClass(item), !item.slides.some(slide => slide.imageUrl.trim()) ? 'grid place-items-center border-dashed' : '']">
                    <PageMediaCarousel
                      v-if="item.slides.some(slide => slide.imageUrl.trim())"
                      :slides="item.slides.filter(slide => slide.imageUrl.trim())"
                      :settings="item.settings"
                      :locale="locale"
                    />
                    <div v-else class="px-4 text-sm opacity-60">Carousel vide</div>
                  </div>
                </PageEditable>
              </template>
            </div>
            </PageEditable>
          </div>
        </div>
      </div>
    </section>
  </PageEditable>
</template>

<script setup lang="ts">
import type {
  PageBuilderButton,
  PageBuilderCarouselItem,
  PageBuilderCard,
  PageBuilderColumn,
  PageBuilderImageItem,
  PageBuilderSection,
  ThemeColorToken,
  ThemeColorSelection
} from '~/shared/pageBuilder'
import type { PageBuilderEditTarget } from '~/shared/pageBuilderEditor'
import PageEditable from '~/components/page-builder/PageEditable.vue'
import PageMediaCarousel from '~/components/page-builder/PageMediaCarousel.vue'
import PageSectionBackground from '~/components/page-builder/PageSectionBackground.vue'
import { pickLocalizedText } from '~/shared/pageBuilder'

const props = defineProps<{
  section: PageBuilderSection
  sections: PageBuilderSection[]
  sectionIndex: number
  locale: string
  editable?: boolean
}>()

const emit = defineEmits<{
  edit: [target: PageBuilderEditTarget]
}>()

const localePath = useLocalePath()

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

const normalizedColumns = computed(() => props.section.columns.slice(0, props.section.columnCount))
const hasBackgroundMedia = computed(() =>
  (props.section.backgroundMode === 'image' && Boolean(props.section.backgroundImage.imageUrl.trim()))
  || (props.section.backgroundMode === 'carousel' && props.section.backgroundCarousel.some(slide => slide.imageUrl.trim()))
)

const sectionToneClass = computed(() => {
  if (props.section.backgroundColor) return ''
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
  const style: Record<string, string> = {}
  const background = colorToCss(props.section.backgroundColor)
  if (background) style.backgroundColor = background
  if (props.section.minHeightPx && props.section.minHeightPx > 0) {
    style.minHeight = `${props.section.minHeightPx}px`
  }
  return style
})

const contentFrameStyle = computed(() => {
  if (props.section.minHeightPx && props.section.minHeightPx > 0) {
    return { minHeight: `${props.section.minHeightPx}px` }
  }
  return {}
})

const containerWidthClass = computed(() => {
  switch (props.section.containerWidth) {
    case 'narrow':
      return 'max-w-4xl'
    case 'wide':
      return 'max-w-7xl'
    case 'xwide':
      return 'max-w-[90rem]'
    case 'edge':
      return 'max-w-[110rem]'
    case 'full':
      return 'max-w-none'
    default:
      return 'max-w-6xl'
  }
})

const gridClass = computed(() => {
  const count = props.section.columnCount
  const reverse = props.section.reverseOnDesktop && count === 2
  if (count === 1) return 'grid-cols-1'
  if (count === 2) return reverse ? 'lg:grid-cols-[.9fr_1.1fr]' : 'lg:grid-cols-[1.1fr_.9fr]'
  if (count === 3) return 'md:grid-cols-2 xl:grid-cols-3'
  return 'md:grid-cols-2 xl:grid-cols-4'
})

const sectionContentVerticalAlignClass = computed(() => {
  switch (props.section.contentVerticalAlign) {
    case 'start':
      return 'items-start'
    case 'end':
      return 'items-end'
    default:
      return 'items-center'
  }
})

const columnJustifyClass = (verticalAlign: string) => {
  switch (verticalAlign) {
    case 'start':
      return 'justify-start'
    case 'end':
      return 'justify-end'
    default:
      return 'justify-center'
  }
}

const contentAlignClass = (align: string) => align === 'center' ? 'items-center text-center' : ''
const hasLocalizedText = (value?: { fr?: string; en?: string } | null) => Boolean(value?.fr?.trim() || value?.en?.trim())

const cardsContainerClass = (display: 'stack' | 'grid-2' | 'grid-3' | 'grid-4') => {
  switch (display) {
    case 'grid-2':
      return 'grid gap-4 sm:grid-cols-2'
    case 'grid-3':
      return 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
    case 'grid-4':
      return 'grid gap-4 md:grid-cols-2 xl:grid-cols-4'
    default:
      return 'grid gap-4 grid-cols-1'
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

const buttonSizeClass = (size: string) => {
  switch (size) {
    case 'xs':
      return 'btn-xs'
    case 'sm':
      return 'btn-sm'
    case 'lg':
      return 'btn-lg'
    default:
      return ''
  }
}

const badgeSizeClass = (size: string) => {
  switch (size) {
    case 'xs': return 'text-xs'
    case 'md': return 'text-base'
    case 'lg': return 'text-lg'
    case 'xl': return 'text-xl'
    case '2xl': return 'text-2xl'
    default: return 'text-sm'
  }
}

const titleSizeClass = (size: string) => {
  switch (size) {
    case 'xs': return 'text-xl'
    case 'sm': return 'text-2xl'
    case 'md': return 'text-3xl'
    case 'lg': return 'text-4xl'
    case 'xl': return 'text-5xl'
    case '2xl': return 'text-6xl'
    default: return 'text-3xl'
  }
}

const textSizeClass = (size: string) => {
  switch (size) {
    case 'xs': return 'text-xs'
    case 'sm': return 'text-sm'
    case 'lg': return 'text-lg'
    case 'xl': return 'text-xl'
    case '2xl': return 'text-2xl'
    default: return 'text-base md:text-lg'
  }
}

const cardTitleSizeClass = (size: string) => {
  switch (size) {
    case 'xs': return 'text-sm'
    case 'sm': return 'text-base'
    case 'lg': return 'text-xl'
    case 'xl': return 'text-2xl'
    case '2xl': return 'text-3xl'
    default: return 'text-lg'
  }
}

const cardTextSizeClass = (size: string) => {
  switch (size) {
    case 'xs': return 'text-xs'
    case 'md': return 'text-base'
    case 'lg': return 'text-lg'
    case 'xl': return 'text-xl'
    case '2xl': return 'text-2xl'
    default: return 'text-sm'
  }
}

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

const columnTextStyle = (column: PageBuilderColumn) => {
  const color = colorToCss(column.textColor)
  return color ? { color } : {}
}

const textColorStyle = (selection?: ThemeColorSelection | null, opacity = 1) => {
  const color = colorToCss(selection, opacity)
  return color ? { color } : {}
}

const badgeStyle = (item: { backgroundColor?: ThemeColorSelection | null; textColor?: ThemeColorSelection | null; borderColor?: ThemeColorSelection | null }) => {
  const style: Record<string, string> = {}
  const background = colorToCss(item.backgroundColor)
  const color = colorToCss(item.textColor)
  const border = colorToCss(item.borderColor)
  if (background) style.backgroundColor = background
  if (color) style.color = color
  if (border) style.borderColor = border
  return style
}

const buttonStyle = (button: PageBuilderButton) => {
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

const cardStyle = (card: PageBuilderCard) => {
  const style: Record<string, string> = {}
  const defaultBackground: ThemeColorSelection = {
    token: (props.section.tone === 'base-200' ? 'base-100' : 'base-200') as ThemeColorToken,
    opacity: 100
  }
  const background = colorToCss(card.backgroundColor) || colorToCss(defaultBackground)
  const border = colorToCss(card.borderColor) || 'var(--color-base-300)'
  const color = colorToCss(card.textColor)
  if (background) style.backgroundColor = background
  if (border) style.borderColor = border
  if (color) style.color = color
  return style
}

const iconWrapperStyle = (card: PageBuilderCard) => {
  const style: Record<string, string> = {}
  style.backgroundColor = colorToCss(card.iconBackgroundColor) || colorToCss({ token: 'primary', opacity: 10 })
  style.color = colorToCss(card.iconColor) || 'var(--color-primary)'
  return style
}

const cardClass = (card: PageBuilderCard) => card.backdropBlur ? 'backdrop-blur' : ''
const cardSizeClass = (card: PageBuilderCard, display: 'stack' | 'grid-2' | 'grid-3' | 'grid-4') => {
  const base = display === 'stack' ? 'w-full' : ''
  const height =
    card.size === 'xl' ? 'min-h-[22rem]' :
    card.size === 'lg' ? 'min-h-[18rem]' :
    card.size === 'md' ? 'min-h-[14rem]' :
    'min-h-[11rem]'
  const span =
    display === 'stack'
      ? ''
      : card.size === 'xl'
        ? (display === 'grid-4' ? 'xl:col-span-2' : 'sm:col-span-2')
        : card.size === 'lg'
          ? 'sm:col-span-2'
          : ''
  return [base, height, span].filter(Boolean).join(' ')
}
const hasButton = (button?: { href?: string | null } | null) => Boolean(button?.href?.trim())

const imageAspectClass = (aspect: string) => {
  switch (aspect) {
    case 'square': return 'aspect-square'
    case 'portrait': return 'aspect-[4/5]'
    default: return props.section.columnCount === 1 ? 'aspect-[16/7]' : 'aspect-[16/10]'
  }
}

const imageFrameClass = (item: PageBuilderImageItem | PageBuilderCarouselItem) => item.framed ? 'overflow-hidden rounded-[2rem] border border-base-300 bg-base-100 shadow-sm' : 'overflow-hidden rounded-[2rem]'
const imageClass = (item: PageBuilderImageItem) => {
  const fitClass = item.fit === 'contain' ? 'object-contain p-6' : 'object-cover'
  const alignClass = item.verticalAlign === 'start' ? 'object-top' : item.verticalAlign === 'end' ? 'object-bottom' : 'object-center'
  const enlargeClass = item.enlarge ? 'scale-110 md:scale-[1.16]' : ''
  return [fitClass, alignClass, enlargeClass].filter(Boolean).join(' ')
}
</script>
