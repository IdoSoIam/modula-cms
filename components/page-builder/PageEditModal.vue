<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[130]">
      <div class="absolute inset-0 bg-black/20 backdrop-blur-[1px]" @click="$emit('close')" />
      <div ref="panelRef" class="absolute overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl" :style="panelStyle">
        <div class="flex cursor-move items-center justify-between gap-3 border-b border-base-300 bg-base-200 px-5 py-4 select-none" @pointerdown="startDrag">
          <div>
            <div class="text-sm opacity-60">Mode edition</div>
            <h3 class="text-xl font-bold">{{ target?.label }}</h3>
          </div>
          <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="$emit('close')"><span class="iconify i-mdi:close" aria-hidden="true" style="font-size:24px;"></span></button>
        </div>

        <div class="overflow-y-auto p-5" :style="bodyStyle">
          <div v-if="target" class="space-y-5">
            <template v-if="target.kind === 'section'">
              <SectionEditor :target="target" />
            </template>

            <template v-else-if="target.kind === 'column'">
              <ColumnEditor :target="target" />
            </template>

            <template v-else-if="target.kind === 'item'">
              <ItemEditor :target="target" />
            </template>

            <template v-else-if="target.kind === 'card'">
              <CardEditor :target="target" />
            </template>

            <template v-else-if="target.kind === 'button'">
              <ButtonEditor :button="target.button" />
            </template>
          </div>

          <div class="mt-6 flex justify-end">
            <button type="button" class="btn" @click="$emit('close')">Fermer</button>
          </div>
        </div>

        <button
          type="button"
          class="absolute bottom-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded bg-base-300/70 text-base-content cursor-se-resize"
          aria-label="Redimensionner"
          @pointerdown.stop="startResize"
        >
          <Icon name="mdi:resize-bottom-right" size="18" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { defineComponent, h, resolveComponent, type PropType } from 'vue'
import ThemeColorPicker from '#modula/components/admin/ThemeColorPicker.vue'
import AdminIconPicker from '#modula/components/admin/IconPicker.vue'
import AdminPageBuilderCardFields from '#modula/components/admin/page-builder/CardFields.vue'
import AdminPageBuilderCarouselFields from '#modula/components/admin/page-builder/CarouselFields.vue'
import AdminPageBuilderSectionBackgroundFields from '#modula/components/admin/page-builder/SectionBackgroundFields.vue'
import type { PageBuilderEditTarget } from '#modula/shared/pageBuilderEditor'
import type { PageBuilderButton, PageBuilderCard, PageBuilderColumnItem, SectionColumnCount, ThemeColorSelection } from '#modula/shared/pageBuilder'
import {
  BUTTON_SIZE_LABELS,
  BUTTON_SIZES,
  BUTTON_TONES,
  CARD_SIZE_LABELS,
  CARD_SIZES,
  CARDS_DISPLAY_LABELS,
  CARDS_DISPLAYS,
  CONTENT_ALIGNS,
  createEmptyColumnsSection,
  createBadgeItem,
  createButtonsItem,
  createCarouselItem,
  createCardsItem,
  createEmptyButton,
  createEmptyCard,
  createEmptyCardElement,
  createEmptyFormField,
  createEmptyFormRow,
  createEmptyContentBlock,
  createFormItem,
  createImageItem,
  createTextItem,
  createTitleItem,
  duplicatePageBuilderCard,
  duplicatePageBuilderItem,
  duplicatePageBuilderSection,
  HEADING_TAG_LABELS,
  HEADING_TAGS,
  IMAGE_ASPECTS,
  IMAGE_FITS,
  PAGE_BUILDER_FORM_FIELD_TYPES,
  PAGE_BUILDER_FORM_FIELD_WIDTHS,
  PAGE_BUILDER_FORM_FIELD_TYPE_LABELS,
  PAGE_BUILDER_FORM_FIELD_WIDTH_LABELS,
  SECTION_COLUMN_COUNTS,
  SECTION_COLUMN_COUNT_LABELS,
  SECTION_CONTAINER_WIDTH_LABELS,
  SECTION_CONTAINER_WIDTHS,
  TYPOGRAPHY_SIZE_LABELS,
  TYPOGRAPHY_SIZES,
  VERTICAL_ALIGNS
} from '#modula/shared/pageBuilder'

const props = defineProps({
  open: { type: Boolean, required: true },
  target: { type: Object as PropType<PageBuilderEditTarget | null>, default: null }
})

defineEmits<{ close: [] }>()
const { t } = useI18n()

const panelRef = ref<HTMLElement | null>(null)
const panelPosition = ref({ x: 32, y: 32 })
const panelSize = ref({ width: 832, height: 760 })
const dragState = ref<{ pointerId: number; offsetX: number; offsetY: number } | null>(null)
const resizeState = ref<{ pointerId: number; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null)
const panelStyle = computed(() => ({
  left: `${panelPosition.value.x}px`,
  top: `${panelPosition.value.y}px`,
  width: `${panelSize.value.width}px`,
  maxWidth: 'calc(100vw - 1rem)',
  height: `${panelSize.value.height}px`,
  maxHeight: 'calc(100vh - 1rem)'
}))
const bodyStyle = computed(() => ({
  maxHeight: `${Math.max(240, panelSize.value.height - 120)}px`
}))

const clampPosition = () => {
  if (!import.meta.client || !panelRef.value) return
  const rect = panelRef.value.getBoundingClientRect()
  panelPosition.value = {
    x: Math.min(Math.max(8, panelPosition.value.x), Math.max(8, window.innerWidth - rect.width - 8)),
    y: Math.min(Math.max(8, panelPosition.value.y), Math.max(8, window.innerHeight - rect.height - 8))
  }
  panelSize.value = {
    width: Math.min(Math.max(560, panelSize.value.width), Math.max(560, window.innerWidth - 16)),
    height: Math.min(Math.max(420, panelSize.value.height), Math.max(420, window.innerHeight - 16))
  }
}

const startDrag = (event: PointerEvent) => {
  if (!panelRef.value) return
  const rect = panelRef.value.getBoundingClientRect()
  dragState.value = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top }
}

const startResize = (event: PointerEvent) => {
  resizeState.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: panelSize.value.width,
    startHeight: panelSize.value.height
  }
}

const onPointerMove = (event: PointerEvent) => {
  if (resizeState.value && resizeState.value.pointerId === event.pointerId) {
    panelSize.value = {
      width: resizeState.value.startWidth + (event.clientX - resizeState.value.startX),
      height: resizeState.value.startHeight + (event.clientY - resizeState.value.startY)
    }
    clampPosition()
    return
  }
  if (!dragState.value || dragState.value.pointerId !== event.pointerId) return
  panelPosition.value = { x: event.clientX - dragState.value.offsetX, y: event.clientY - dragState.value.offsetY }
  clampPosition()
}

watch(() => props.open, open => { if (open) nextTick(() => clampPosition()) }, { immediate: true })

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', () => {
    dragState.value = null
    resizeState.value = null
  })
  window.addEventListener('resize', clampPosition)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('resize', clampPosition)
})

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`
const removeAt = <T,>(list: T[], index: number) => { list.splice(index, 1) }
const currentSectionIndex = (target: Extract<PageBuilderEditTarget, { kind: 'section' }>) => Math.max(0, target.sections.indexOf(target.section))
const currentItemIndex = (target: Extract<PageBuilderEditTarget, { kind: 'item' }>) => Math.max(0, target.parentItems.indexOf(target.item))
const currentCardIndex = (target: Extract<PageBuilderEditTarget, { kind: 'card' }>) => Math.max(0, target.parentCards.indexOf(target.card))
const moveItem = <T,>(list: T[], index: number, direction: -1 | 1) => {
  const next = index + direction
  if (next < 0 || next >= list.length) return
  const [item] = list.splice(index, 1)
  if (!item) return
  list.splice(next, 0, item)
}

const duplicateAt = <T,>(list: T[], index: number, factory: (item: T) => T) => {
  const item = list[index]
  if (!item) return
  list.splice(index + 1, 0, factory(item))
}

const itemAlignLabel = (align: string) => {
  switch (align) {
    case 'center': return 'Centre'
    case 'end': return 'Droite'
    default: return 'Gauche'
  }
}

const TranslationFields = defineComponent({
  props: {
    modelValue: { type: Object as PropType<Record<string, string>>, required: true },
    label: { type: String, required: true },
    size: { type: [String, Object] as PropType<any>, default: undefined },
    multiline: { type: Boolean, default: false }
  },
  emits: ['update:size'],
  setup(props, { emit }) {
    const { locales } = useSiteLocales()
    const resolvedLocales = computed(() => locales.value.length ? locales.value : ['fr', 'en'])
    const lang = ref<string>(resolvedLocales.value[0] || 'fr')

    watch(resolvedLocales, (value) => {
      const next = value[0] || 'fr'
      if (!value.includes(lang.value)) {
        lang.value = next
      }
      for (const localeCode of value) {
        if (typeof props.modelValue[localeCode] !== 'string') {
          props.modelValue[localeCode] = ''
        }
      }
    }, { immediate: true })

    const tabLabel = (localeCode: string) => localeCode.toUpperCase()

    return () => h('div', { class: 'form-control' }, [
      h('div', { class: 'mb-2 flex items-center justify-between gap-2' }, [
        h('div', { class: 'flex items-center gap-2' }, [
          h('label', { class: 'label py-0' }, [h('span', { class: 'label-text' }, props.label)]),
          props.size !== undefined ? h('select', {
            class: 'select select-xs select-bordered w-auto min-w-20',
            value: props.size?.value ?? props.size,
            onChange: (event: Event) => {
              const value = (event.target as HTMLSelectElement).value
              if (props.size && typeof props.size === 'object' && 'value' in props.size) props.size.value = value
              else emit('update:size', value)
            }
          }, TYPOGRAPHY_SIZES.map(size => h('option', { value: size }, TYPOGRAPHY_SIZE_LABELS[size]))) : null
        ]),
        h('div', { class: 'tabs tabs-box tabs-xs' }, resolvedLocales.value.map(localeCode =>
          h('button', {
            type: 'button',
            class: ['tab cursor-pointer', lang.value === localeCode ? 'tab-active' : 'border-0'],
            onClick: () => { lang.value = localeCode }
          }, tabLabel(localeCode))
        ))
      ]),
      props.multiline
        ? h('textarea', { class: 'textarea textarea-bordered w-full', rows: 4, value: props.modelValue[lang.value], onInput: (e: Event) => { props.modelValue[lang.value] = (e.target as HTMLTextAreaElement).value } })
        : h('input', { class: 'input input-bordered w-full', value: props.modelValue[lang.value], onInput: (e: Event) => { props.modelValue[lang.value] = (e.target as HTMLInputElement).value } })
    ])
  }
})

const ButtonEditor = defineComponent({
  props: { button: { type: Object as PropType<PageBuilderButton>, required: true } },
  setup(props) {
    return () => h('div', { class: 'space-y-4' }, [
      h(TranslationFields, { modelValue: props.button.label, label: 'Label' }),
      h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Lien')]), h('input', { class: 'input input-bordered w-full', value: props.button.href, onInput: (e: Event) => { props.button.href = (e.target as HTMLInputElement).value } })]),
      h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
        h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Style')]), h('select', { class: 'select select-bordered w-full', value: props.button.tone, onChange: (e: Event) => { props.button.tone = (e.target as HTMLSelectElement).value as any } }, BUTTON_TONES.map(t => h('option', { value: t }, t)))]),
        h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Taille')]), h('select', { class: 'select select-bordered w-full', value: props.button.size, onChange: (e: Event) => { props.button.size = (e.target as HTMLSelectElement).value as any } }, BUTTON_SIZES.map(s => h('option', { value: s }, BUTTON_SIZE_LABELS[s])))])
      ]),
      h(ThemeColorPicker, { label: 'Fond du bouton', modelValue: props.button.backgroundColor || null, defaultToken: 'primary', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.button.backgroundColor = val } }),
      h(ThemeColorPicker, { label: 'Texte du bouton', modelValue: props.button.textColor || null, defaultToken: 'primary-content', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.button.textColor = val } }),
      h(ThemeColorPicker, { label: 'Bordure du bouton', modelValue: props.button.borderColor || null, defaultToken: 'transparent', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.button.borderColor = val } })
    ])
  }
})

const CardEditor = defineComponent({
  props: { target: { type: Object as PropType<Extract<PageBuilderEditTarget, { kind: 'card' }>>, required: true } },
  setup(props) {
    return () => h('div', { class: 'space-y-4' }, [
      h('div', { class: 'flex justify-end gap-2' }, [
        h('button', { type: 'button', class: 'btn btn-xs', disabled: currentCardIndex(props.target) === 0, onClick: () => moveItem(props.target.parentCards, currentCardIndex(props.target), -1) }, 'Monter'),
        h('button', { type: 'button', class: 'btn btn-xs', disabled: currentCardIndex(props.target) === props.target.parentCards.length - 1, onClick: () => moveItem(props.target.parentCards, currentCardIndex(props.target), 1) }, 'Descendre'),
        h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => duplicateAt(props.target.parentCards, currentCardIndex(props.target), duplicatePageBuilderCard) }, 'Dupliquer'),
        h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => removeAt(props.target.parentCards, currentCardIndex(props.target)) }, 'Supprimer')
      ]),
      h('div', { class: 'rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm' }, [
        h(AdminPageBuilderCardFields, { card: props.target.card })
      ])
    ])
  }
})

const ItemEditor = defineComponent({
  props: { target: { type: Object as PropType<Extract<PageBuilderEditTarget, { kind: 'item' }>>, required: true } },
  setup(props) {
    const openFormPanelIds = ref<string[]>([])
    const formTab = ref<'content' | 'action' | 'fields'>('content')
    const isFormPanelOpen = (id: string) => openFormPanelIds.value.includes(id)
    const toggleFormPanel = (id: string) => {
      openFormPanelIds.value = isFormPanelOpen(id)
        ? openFormPanelIds.value.filter(panelId => panelId !== id)
        : [...openFormPanelIds.value, id]
    }
    const openFormPanel = (id: string) => {
      if (!isFormPanelOpen(id)) openFormPanelIds.value = [...openFormPanelIds.value, id]
    }
    return () => {
      const item = props.target.item
      const header = h('div', { class: 'flex justify-end gap-2' }, [
        h('button', { type: 'button', class: 'btn btn-xs', disabled: currentItemIndex(props.target) === 0, onClick: () => moveItem(props.target.parentItems, currentItemIndex(props.target), -1) }, 'Monter'),
        h('button', { type: 'button', class: 'btn btn-xs', disabled: currentItemIndex(props.target) === props.target.parentItems.length - 1, onClick: () => moveItem(props.target.parentItems, currentItemIndex(props.target), 1) }, 'Descendre'),
        h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => duplicateAt(props.target.parentItems, currentItemIndex(props.target), duplicatePageBuilderItem) }, 'Dupliquer'),
        h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => removeAt(props.target.parentItems, currentItemIndex(props.target)) }, 'Supprimer')
      ])

      if (item.type === 'badge' || item.type === 'title' || item.type === 'text') {
        return h('div', { class: 'space-y-4' }, [
          header,
          h(TranslationFields, { modelValue: item.text, label: item.type === 'badge' ? 'Badge' : item.type === 'title' ? 'Titre' : 'Texte', size: item.size, multiline: item.type === 'text', 'onUpdate:size': (val: string) => { item.size = val as any } }),
          item.type === 'title' || item.type === 'text'
            ? h('div', { class: 'form-control' }, [
                h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Alignement')]),
                h('select', {
                  class: 'select select-bordered w-full',
                  value: item.align || 'start',
                  onChange: (e: Event) => { item.align = (e.target as HTMLSelectElement).value as any }
                }, CONTENT_ALIGNS.map(align => h('option', { value: align }, itemAlignLabel(align))))
              ])
            : null,
          item.type === 'title' || item.type === 'text'
            ? h(ThemeColorPicker, {
                label: item.type === 'title' ? 'Couleur du titre' : 'Couleur du texte',
                modelValue: item.textColor || null,
                defaultToken: 'base-content',
                'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.textColor = val }
              })
            : null,
          item.type === 'title'
            ? h('div', { class: 'form-control' }, [
                h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Balise du titre')]),
                h('select', {
                  class: 'select select-bordered w-full',
                  value: item.headingTag || 'h2',
                  onChange: (e: Event) => { item.headingTag = (e.target as HTMLSelectElement).value as any }
                }, HEADING_TAGS.map(tag => h('option', { value: tag }, HEADING_TAG_LABELS[tag])))
              ])
            : null,
          item.type === 'badge'
            ? h('div', { class: 'space-y-4' }, [
                h(ThemeColorPicker, { label: 'Fond du badge', modelValue: item.backgroundColor || null, defaultToken: 'primary', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.backgroundColor = val } }),
                h(ThemeColorPicker, { label: 'Texte du badge', modelValue: item.textColor || null, defaultToken: 'primary-content', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.textColor = val } }),
                h(ThemeColorPicker, { label: 'Bordure du badge', modelValue: item.borderColor || null, defaultToken: 'primary', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.borderColor = val } })
              ])
            : null
        ])
      }

      if (item.type === 'buttons') {
        return h('div', { class: 'space-y-4' }, [
          header,
          h('div', { class: 'rounded-xl border border-base-300 bg-base-100 p-4' }, [h('div', { class: 'mb-3 flex items-center justify-between gap-2' }, [h('div', { class: 'font-medium' }, 'Bouton principal'), !item.primaryButton ? h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => { item.primaryButton = createEmptyButton() } }, 'Ajouter') : h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => { item.primaryButton = null } }, 'Retirer')]), item.primaryButton ? h(ButtonEditor, { button: item.primaryButton }) : null]),
          h('div', { class: 'rounded-xl border border-base-300 bg-base-100 p-4' }, [h('div', { class: 'mb-3 flex items-center justify-between gap-2' }, [h('div', { class: 'font-medium' }, 'Bouton secondaire'), !item.secondaryButton ? h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => { item.secondaryButton = createEmptyButton() } }, 'Ajouter') : h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => { item.secondaryButton = null } }, 'Retirer')]), item.secondaryButton ? h(ButtonEditor, { button: item.secondaryButton }) : null])
        ])
      }

      if (item.type === 'image') {
        return h('div', { class: 'space-y-4' }, [
          header,
          h(resolveComponent('ImageInput') as any, { modelValue: item.imageUrl, 'onUpdate:modelValue': (val: string) => { item.imageUrl = val } }),
          h(TranslationFields, { modelValue: item.alt, label: 'Alt' }),
          h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
            h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Ratio')]), h('select', { class: 'select select-bordered w-full', value: item.aspect, onChange: (e: Event) => { item.aspect = (e.target as HTMLSelectElement).value as any } }, IMAGE_ASPECTS.map(a => h('option', { value: a }, a)))]),
            h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Placement')]), h('select', { class: 'select select-bordered w-full', value: item.fit, onChange: (e: Event) => { item.fit = (e.target as HTMLSelectElement).value as any } }, IMAGE_FITS.map(f => h('option', { value: f }, f)))]),
            h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Alignement vertical')]), h('select', { class: 'select select-bordered w-full', value: item.verticalAlign, onChange: (e: Event) => { item.verticalAlign = (e.target as HTMLSelectElement).value as any } }, VERTICAL_ALIGNS.map(a => h('option', { value: a }, a)))])
          ]),
          h('div', { class: 'form-control' }, [
            h('label', { class: 'label' }, [
              h('span', { class: 'label-text' }, 'Largeur chargee'),
              h('span', { class: 'label-text-alt' }, item.requestedWidthPx ? `${item.requestedWidthPx}px` : 'Auto'),
              ' '
            ]),
            h('input', {
              class: 'range range-primary range-sm',
              type: 'range',
              min: '0',
              max: '1800',
              step: '20',
              value: item.requestedWidthPx ?? 0,
              onInput: (e: Event) => {
                const value = Number((e.target as HTMLInputElement).value)
                const normalized = Number.isFinite(value) ? Math.max(0, Math.min(2400, Math.round(value))) : 0
                item.requestedWidthPx = normalized > 0 ? normalized : null
              }
            }),
            h('div', { class: 'mt-2 flex items-center gap-3' }, [
              h('input', {
                class: 'input input-bordered w-32',
                type: 'number',
                min: '0',
                max: '2400',
                step: '20',
                value: item.requestedWidthPx ?? 0,
                onInput: (e: Event) => {
                  const value = Number((e.target as HTMLInputElement).value)
                  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(2400, Math.round(value))) : 0
                  item.requestedWidthPx = normalized > 0 ? normalized : null
                }
              }),
              h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => { item.requestedWidthPx = null } }, 'Auto')
            ])
          ]),
          h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'toggle toggle-primary', checked: item.framed, onChange: (e: Event) => { item.framed = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, "Afficher l'image dans une carte")]),
          h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'toggle toggle-primary', checked: item.enlarge, onChange: (e: Event) => { item.enlarge = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, 'Forcer un affichage plus grand')]),
          h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'toggle toggle-primary', checked: item.lightboxEnabled, onChange: (e: Event) => { item.lightboxEnabled = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, 'Ouvrir l’image en grand')])
        ])
      }

      if (item.type === 'carousel') {
        return h('div', { class: 'space-y-4' }, [
          header,
          h(AdminPageBuilderCarouselFields, { carousel: item })
        ])
      }

      if (item.type === 'form') {
        const formFields = item.rows.flatMap(row => row.fields)
        return h('div', [
          header,
          h('div', { class: 'tabs tabs-lift flex-wrap' }, [
            h('button', { type: 'button', class: ['tab cursor-pointer', formTab.value === 'content' ? 'tab-active' : 'border-0'], onClick: () => { formTab.value = 'content' } }, 'Style et contenu'),
            h('button', { type: 'button', class: ['tab cursor-pointer', formTab.value === 'action' ? 'tab-active' : 'border-0'], onClick: () => { formTab.value = 'action' } }, 'Action a la soumission'),
            h('button', { type: 'button', class: ['tab cursor-pointer', formTab.value === 'fields' ? 'tab-active' : 'border-0'], onClick: () => { formTab.value = 'fields' } }, 'Formulaire')
          ]),
          formTab.value === 'content' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 space-y-4' }, [
            h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
              h('div', { class: 'form-control' }, [
                h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Clé technique')]),
                h('input', { class: 'input input-bordered w-full', value: item.formKey, onInput: (e: Event) => { item.formKey = (e.target as HTMLInputElement).value } })
              ]),
              h('div', { class: 'form-control' }, [
                h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Style du bouton')]),
                h('select', { class: 'select select-bordered w-full', value: item.submitButtonTone, onChange: (e: Event) => { item.submitButtonTone = (e.target as HTMLSelectElement).value as any } }, BUTTON_TONES.map(tone => h('option', { value: tone }, tone)))
              ])
            ]),
            h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
              h(ThemeColorPicker, { label: 'Fond de la carte du formulaire', modelValue: item.cardBackgroundColor || null, defaultToken: 'base-100', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.cardBackgroundColor = val } }),
              h(ThemeColorPicker, { label: 'Couleur des labels', modelValue: item.labelColor || null, defaultToken: 'base-content', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.labelColor = val } }),
              h(ThemeColorPicker, { label: 'Fond du bouton d’envoi', modelValue: item.submitButtonBackgroundColor || null, defaultToken: 'primary', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.submitButtonBackgroundColor = val } }),
              h(ThemeColorPicker, { label: 'Texte du bouton d’envoi', modelValue: item.submitButtonTextColor || null, defaultToken: 'primary-content', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.submitButtonTextColor = val } }),
              h(ThemeColorPicker, { label: 'Bordure du bouton d’envoi', modelValue: item.submitButtonBorderColor || null, defaultToken: 'transparent', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.submitButtonBorderColor = val } })
            ]),
            h(TranslationFields, { modelValue: item.title, label: 'Titre du formulaire' }),
            h(TranslationFields, { modelValue: item.intro, label: 'Introduction', multiline: true }),
            h(TranslationFields, { modelValue: item.submitLabel, label: 'Libellé du bouton' }),
            h(TranslationFields, { modelValue: item.successMessage, label: 'Message de succès', multiline: true })
          ]) : null,
          formTab.value === 'action' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 space-y-3' }, [
              h('div', { class: 'flex items-center justify-between gap-2' }, [
              h('div', { class: 'font-medium' }, t('admin.pageEditorPage.formBuilder.submitAction')),
              h('select', { class: 'select select-bordered select-sm', value: item.action.type, onChange: (e: Event) => {
                const type = (e.target as HTMLSelectElement).value
                item.action = type === 'internalWebhook'
                  ? { type: 'internalWebhook', actionKey: '' }
                  : { type: 'email', toMode: 'custom', to: '', toFieldName: '', templateAction: '', replyToFieldName: '', cc: '', bcc: '' }
              } }, [
                h('option', { value: 'email' }, 'Email'),
                h('option', { value: 'internalWebhook' }, 'Fonction interne')
              ])
            ]),
            item.action.type === 'email'
              ? h('div', { class: 'space-y-3' }, [
                  h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
                    h('div', { class: 'form-control' }, [
                      h('label', { class: 'label' }, [h('span', { class: 'label-text' }, t('admin.pageEditorPage.formBuilder.recipientMode'))]),
                      h('select', {
                        class: 'select select-bordered w-full',
                        value: item.action.toMode,
                        onChange: (e: Event) => {
                          if (item.action.type === 'email') {
                            item.action.toMode = (e.target as HTMLSelectElement).value as any
                          }
                        }
                      }, [
                        h('option', { value: 'custom' }, t('admin.pageEditorPage.formBuilder.recipientCustom')),
                        h('option', { value: 'field' }, t('admin.pageEditorPage.formBuilder.recipientField')),
                        h('option', { value: 'current-user' }, t('admin.pageEditorPage.formBuilder.recipientCurrentUser'))
                      ])
                    ]),
                    item.action.toMode === 'field'
                      ? h('div', { class: 'form-control' }, [
                          h('label', { class: 'label' }, [h('span', { class: 'label-text' }, t('admin.pageEditorPage.formBuilder.recipientFieldLabel'))]),
                          h('select', {
                            class: 'select select-bordered w-full',
                            value: item.action.toFieldName,
                            onChange: (e: Event) => { item.action.type === 'email' && (item.action.toFieldName = (e.target as HTMLSelectElement).value) }
                          }, [
                            h('option', { value: '' }, '--'),
                            ...formFields
                              .filter(field => field.type === 'email')
                              .map(field => h('option', { value: field.name }, field.name))
                          ])
                        ])
                      : h('div', { class: 'form-control' }, [
                          h('label', { class: 'label' }, [h('span', { class: 'label-text' }, t('admin.pageEditorPage.formBuilder.recipientEmail'))]),
                          h('input', {
                            class: 'input input-bordered w-full',
                            placeholder: t('admin.pageEditorPage.formBuilder.recipientEmailPlaceholder'),
                            value: item.action.to,
                            disabled: item.action.toMode !== 'custom',
                            onInput: (e: Event) => { item.action.type === 'email' && (item.action.to = (e.target as HTMLInputElement).value) }
                          })
                        ])
                  ]),
                  h('input', { class: 'input input-bordered w-full', placeholder: 'Action template email', value: item.action.templateAction, onInput: (e: Event) => { item.action.type === 'email' && (item.action.templateAction = (e.target as HTMLInputElement).value) } }),
                  h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
                    h('div', { class: 'form-control' }, [
                      h('label', { class: 'label' }, [h('span', { class: 'label-text' }, t('admin.pageEditorPage.formBuilder.replyToField'))]),
                      h('select', {
                        class: 'select select-bordered w-full',
                        value: item.action.replyToFieldName,
                        onChange: (e: Event) => { item.action.type === 'email' && (item.action.replyToFieldName = (e.target as HTMLSelectElement).value) }
                      }, [
                        h('option', { value: '' }, '--'),
                        ...formFields
                          .filter(field => field.type === 'email')
                          .map(field => h('option', { value: field.name }, field.name))
                      ])
                    ]),
                    h('div', { class: 'form-control' }, [
                      h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'CC')]),
                      h('input', { class: 'input input-bordered w-full', placeholder: 'email1@example.com, email2@example.com', value: item.action.cc, onInput: (e: Event) => { item.action.type === 'email' && (item.action.cc = (e.target as HTMLInputElement).value) } })
                    ]),
                    h('div', { class: 'form-control md:col-span-2' }, [
                      h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'CCI')]),
                      h('input', { class: 'input input-bordered w-full', placeholder: 'email1@example.com, email2@example.com', value: item.action.bcc, onInput: (e: Event) => { item.action.type === 'email' && (item.action.bcc = (e.target as HTMLInputElement).value) } })
                    ])
                  ])
                ])
              : h('input', { class: 'input input-bordered w-full', placeholder: 'Action interne', value: item.action.actionKey, onInput: (e: Event) => { item.action.type === 'internalWebhook' && (item.action.actionKey = (e.target as HTMLInputElement).value) } })
          ]) : null,
          formTab.value === 'fields' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 space-y-4' }, [
            h('div', { class: 'flex justify-end' }, [
              h('button', { type: 'button', class: 'btn btn-sm btn-primary', onClick: () => {
                const row = createEmptyFormRow(createId('form-row'))
                item.rows.push(row)
                openFormPanel(`row-${row.id}`)
              } }, 'Ajouter une ligne')
            ]),
            ...item.rows.map((row, rowIndex) => h('div', { class: 'rounded-xl border border-base-300 bg-base-100 p-4 space-y-4', key: row.id }, [
              h('div', { class: 'flex flex-wrap items-center justify-between gap-2' }, [
                h('button', { type: 'button', class: 'min-w-0 flex-1 cursor-pointer text-left', onClick: () => toggleFormPanel(`row-${row.id}`) }, [
                  h('div', { class: 'flex items-center gap-2' }, [
                    h(resolveComponent('Icon'), { name: isFormPanelOpen(`row-${row.id}`) ? 'mdi:chevron-down' : 'mdi:chevron-right', size: '18' }),
                    h('div', { class: 'font-medium' }, `Ligne ${rowIndex + 1}`)
                  ]),
                  h('div', { class: 'mt-1 pl-6 text-xs opacity-65' }, `${row.fields.length} champ(s)`)
                ]),
                h('div', { class: 'flex gap-2' }, [
                  h('button', { type: 'button', class: 'btn btn-xs', disabled: rowIndex === 0, onClick: () => moveItem(item.rows, rowIndex, -1) }, t('admin.customizationLayoutPage.moveUp')),
                  h('button', { type: 'button', class: 'btn btn-xs', disabled: rowIndex === item.rows.length - 1, onClick: () => moveItem(item.rows, rowIndex, 1) }, t('admin.customizationLayoutPage.moveDown')),
                  h('button', { type: 'button', class: 'btn btn-xs btn-outline', disabled: row.fields.length >= 2, onClick: () => {
                    const field = createEmptyFormField(createId('field'))
                    row.fields.push(field)
                    openFormPanel(`row-${row.id}`)
                    openFormPanel(`field-${field.id}`)
                  } }, 'Ajouter un champ'),
                  h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => item.rows.splice(rowIndex, 1) }, 'Supprimer')
                ])
              ]),
              ...(isFormPanelOpen(`row-${row.id}`) ? row.fields.map((field, fieldIndex) => h('div', { class: 'rounded-xl border border-base-300 bg-base-200 p-4 space-y-4', key: field.id }, [
                h('div', { class: 'flex flex-wrap items-center justify-between gap-2' }, [
                  h('button', { type: 'button', class: 'min-w-0 flex-1 cursor-pointer text-left', onClick: () => toggleFormPanel(`field-${field.id}`) }, [
                    h('div', { class: 'flex items-center gap-2' }, [
                      h(resolveComponent('Icon'), { name: isFormPanelOpen(`field-${field.id}`) ? 'mdi:chevron-down' : 'mdi:chevron-right', size: '18' }),
                      h('div', { class: 'font-medium' }, `Champ ${fieldIndex + 1}`)
                    ]),
                    h('div', { class: 'mt-1 pl-6 text-xs opacity-65' }, field.label.fr || field.label.en || field.name || 'Sans label')
                  ]),
                  h('div', { class: 'flex gap-2' }, [
                    h('button', { type: 'button', class: 'btn btn-xs', disabled: fieldIndex === 0, onClick: () => moveItem(row.fields, fieldIndex, -1) }, t('admin.customizationLayoutPage.moveUp')),
                    h('button', { type: 'button', class: 'btn btn-xs', disabled: fieldIndex === row.fields.length - 1, onClick: () => moveItem(row.fields, fieldIndex, 1) }, t('admin.customizationLayoutPage.moveDown')),
                    h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => row.fields.splice(fieldIndex, 1) }, 'Supprimer')
                  ])
                ]),
                ...(isFormPanelOpen(`field-${field.id}`) ? [
                  h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
                    h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Nom technique')]), h('input', { class: 'input input-bordered w-full', value: field.name, onInput: (e: Event) => { field.name = (e.target as HTMLInputElement).value } })]),
                    h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Type')]), h('select', { class: 'select select-bordered w-full', value: field.type, onChange: (e: Event) => { field.type = (e.target as HTMLSelectElement).value as any } }, PAGE_BUILDER_FORM_FIELD_TYPES.map(type => h('option', { value: type }, PAGE_BUILDER_FORM_FIELD_TYPE_LABELS[type])))]),
                    h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Largeur')]), h('select', { class: 'select select-bordered w-full', value: String(field.width), onChange: (e: Event) => { field.width = Number((e.target as HTMLSelectElement).value) as any } }, PAGE_BUILDER_FORM_FIELD_WIDTHS.map(width => h('option', { value: String(width) }, PAGE_BUILDER_FORM_FIELD_WIDTH_LABELS[width])))]),
                    h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'checkbox checkbox-primary checkbox-sm', checked: field.required, onChange: (e: Event) => { field.required = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, 'Champ requis')])
                  ]),
                  h(TranslationFields, { modelValue: field.label, label: 'Label' }),
                  h(TranslationFields, { modelValue: field.placeholder, label: 'Placeholder' }),
                  h(TranslationFields, { modelValue: field.helpText, label: 'Aide', multiline: true }),
                  h(TranslationFields, { modelValue: field.errorMessage, label: 'Message d’erreur', multiline: true })
                ] : [])
              ])) : [])
            ]))
          ]) : null
        ])
      }

      const cardsItem = item as Extract<PageBuilderColumnItem, { type: 'cards' }>
      return h('div', { class: 'space-y-4' }, [
        header,
        h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Affichage des cartes')]), h('select', { class: 'select select-bordered w-full', value: cardsItem.display, onChange: (e: Event) => { cardsItem.display = (e.target as HTMLSelectElement).value as any } }, CARDS_DISPLAYS.map(d => h('option', { value: d }, CARDS_DISPLAY_LABELS[d])))]),
        h('div', { class: 'flex justify-end' }, [h('button', { type: 'button', class: 'btn btn-sm btn-primary', onClick: () => {
          const id = createId('card')
          cardsItem.cards.push({
            ...createEmptyCard(id),
            elements: [
              createEmptyCardElement(`${id}-element-1`, 'title'),
              createEmptyCardElement(`${id}-element-2`, 'text')
            ]
          })
        } }, 'Ajouter une carte')])
      ])
    }
  }
})

const ColumnEditor = defineComponent({
  props: { target: { type: Object as PropType<Extract<PageBuilderEditTarget, { kind: 'column' }>>, required: true } },
  setup(props) {
    return () => h('div', { class: 'space-y-4' }, [
      h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
        h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Alignement horizontal')]), h('select', { class: 'select select-bordered w-full', value: props.target.column.align, onChange: (e: Event) => { props.target.column.align = (e.target as HTMLSelectElement).value as any } }, CONTENT_ALIGNS.map(a => h('option', { value: a }, a)))]),
        h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Alignement vertical du contenu de la colonne')]), h('select', { class: 'select select-bordered w-full', value: props.target.column.verticalAlign, onChange: (e: Event) => { props.target.column.verticalAlign = (e.target as HTMLSelectElement).value as any } }, VERTICAL_ALIGNS.map(a => h('option', { value: a }, a)))])
      ]),
      h('div', { class: 'rounded-2xl border border-base-300 bg-base-200 p-4' }, [
        h('div', { class: 'mb-3 font-medium' }, 'Ajouter un element'),
        h('div', { class: 'flex flex-wrap gap-2' }, [
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createBadgeItem(createId('badge'))) }, 'Badge'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createTitleItem(createId('title'))) }, 'Titre'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createTextItem(createId('text'))) }, 'Texte'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createButtonsItem(createId('buttons'))) }, 'Boutons'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createFormItem(createId('form'))) }, 'Formulaire'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createCardsItem(createId('cards'))) }, 'Cartes'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createImageItem(createId('image'))) }, 'Image'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createCarouselItem(createId('carousel'))) }, 'Carousel')
        ])
      ])
    ])
  }
})

const SectionEditor = defineComponent({
  props: { target: { type: Object as PropType<Extract<PageBuilderEditTarget, { kind: 'section' }>>, required: true } },
  setup(props) {
    const tab = ref<'structure' | 'background' | 'insert'>('structure')
    const addStandaloneItem = (position: 'beforeItems' | 'afterItems', type: 'title' | 'text') => {
      const id = createId(type)
      const item = type === 'title' ? createTitleItem(id) : createTextItem(id)
      props.target.section[position].push(item)
    }

    const standaloneItemLabel = (type: 'title' | 'text') => type === 'title' ? 'Titre' : 'Texte'

    const standaloneGroup = (position: 'beforeItems' | 'afterItems', label: string) => h('div', { class: 'space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm' }, [
      h('div', { class: 'flex flex-wrap items-center justify-between gap-3' }, [
        h('div', { class: 'font-medium' }, label),
        h('div', { class: 'flex flex-wrap gap-2' }, [
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => addStandaloneItem(position, 'title') }, 'Ajouter un titre'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => addStandaloneItem(position, 'text') }, 'Ajouter un texte')
        ])
      ]),
      props.target.section[position].length
        ? h('div', { class: 'space-y-3' }, props.target.section[position].map((item, itemIndex) => h('div', {
          key: item.id,
          class: 'rounded-xl border border-base-300 bg-base-200 p-4'
        }, [
          h('div', { class: 'mb-3 flex flex-wrap items-start justify-between gap-3' }, [
            h('div', { class: 'min-w-0 flex-1' }, [
              h('div', { class: 'font-medium' }, standaloneItemLabel(item.type)),
              h('div', { class: 'mt-1 text-xs opacity-65' }, item.text.fr || item.text.en || 'Sans contenu')
            ]),
            h('div', { class: 'flex flex-wrap gap-2' }, [
              h('button', { type: 'button', class: 'btn btn-xs', disabled: itemIndex === 0, onClick: () => moveItem(props.target.section[position], itemIndex, -1) }, 'Monter'),
              h('button', { type: 'button', class: 'btn btn-xs', disabled: itemIndex === props.target.section[position].length - 1, onClick: () => moveItem(props.target.section[position], itemIndex, 1) }, 'Descendre'),
              h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => duplicateAt(props.target.section[position], itemIndex, (entry) => duplicatePageBuilderItem(entry) as typeof entry) }, 'Dupliquer'),
              h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => removeAt(props.target.section[position], itemIndex) }, 'Supprimer')
            ])
          ]),
          h('div', { class: 'space-y-4' }, [
            h(TranslationFields, {
              modelValue: item.text,
              label: item.type === 'title' ? 'Titre' : 'Texte',
              size: item.size,
              multiline: item.type === 'text',
              'onUpdate:size': (val: string) => { item.size = val as any }
            }),
            h('div', { class: 'form-control' }, [
              h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Alignement')]),
              h('select', {
                class: 'select select-bordered w-full',
                value: item.align || 'start',
                onChange: (e: Event) => { item.align = (e.target as HTMLSelectElement).value as any }
              }, CONTENT_ALIGNS.map(align => h('option', { value: align }, itemAlignLabel(align))))
            ]),
            h(ThemeColorPicker, {
              label: item.type === 'title' ? 'Couleur du titre' : 'Couleur du texte',
              modelValue: item.textColor || null,
              defaultToken: 'base-content',
              'onUpdate:modelValue': (val: ThemeColorSelection | null) => { item.textColor = val }
            }),
            item.type === 'title'
              ? h('div', { class: 'form-control' }, [
                  h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Balise du titre')]),
                  h('select', {
                    class: 'select select-bordered w-full',
                    value: item.headingTag || 'h2',
                    onChange: (e: Event) => { item.headingTag = (e.target as HTMLSelectElement).value as any }
                  }, HEADING_TAGS.map(tag => h('option', { value: tag }, HEADING_TAG_LABELS[tag])))
                ])
              : null
          ])
        ])))
        : h('div', { class: 'rounded-xl border border-dashed border-base-300 px-4 py-5 text-sm opacity-70' }, 'Aucun élément')
    ])

    return () => h('div', { class: 'space-y-4' }, [
      h('div', { class: 'flex justify-end gap-2' }, [
        h('button', { type: 'button', class: 'btn btn-xs', disabled: currentSectionIndex(props.target) === 0, onClick: () => moveItem(props.target.sections, currentSectionIndex(props.target), -1) }, 'Monter'),
        h('button', { type: 'button', class: 'btn btn-xs', disabled: currentSectionIndex(props.target) === props.target.sections.length - 1, onClick: () => moveItem(props.target.sections, currentSectionIndex(props.target), 1) }, 'Descendre'),
        h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => duplicateAt(props.target.sections, currentSectionIndex(props.target), duplicatePageBuilderSection) }, 'Dupliquer'),
        h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => removeAt(props.target.sections, currentSectionIndex(props.target)) }, 'Supprimer')
      ]),
      h('div', { class: 'space-y-0' }, [
        h('div', { class: 'tabs tabs-lift flex-wrap' }, [
          h('button', { type: 'button', class: ['tab cursor-pointer', tab.value === 'structure' ? 'tab-active' : 'border-0'], onClick: () => { tab.value = 'structure' } }, 'Structure'),
          h('button', { type: 'button', class: ['tab cursor-pointer', tab.value === 'background' ? 'tab-active' : 'border-0'], onClick: () => { tab.value = 'background' } }, 'Fond'),
          h('button', { type: 'button', class: ['tab cursor-pointer', tab.value === 'insert' ? 'tab-active' : 'border-0'], onClick: () => { tab.value = 'insert' } }, 'Insertion')
        ]),
        tab.value === 'insert' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 shadow-sm' }, [
          h('div', { class: 'mb-3 font-medium' }, 'Ajouter une section'),
          h('div', { class: 'grid gap-3 md:grid-cols-2' }, [
            h('div', { class: 'space-y-2' }, [h('div', { class: 'text-sm opacity-70' }, 'Au-dessus'), h('div', { class: 'flex flex-wrap gap-2' }, SECTION_COLUMN_COUNTS.map(count => h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.sections.splice(currentSectionIndex(props.target), 0, createEmptyColumnsSection(createId('section'), count as SectionColumnCount)) }, `${count} colonne${count > 1 ? 's' : ''}`)))]),
            h('div', { class: 'space-y-2' }, [h('div', { class: 'text-sm opacity-70' }, 'En-dessous'), h('div', { class: 'flex flex-wrap gap-2' }, SECTION_COLUMN_COUNTS.map(count => h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.sections.splice(currentSectionIndex(props.target) + 1, 0, createEmptyColumnsSection(createId('section'), count as SectionColumnCount)) }, `${count} colonne${count > 1 ? 's' : ''}`)))])
          ])
        ]) : null,
        tab.value === 'structure' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 shadow-sm' }, [
          h('div', { class: 'space-y-4' }, [
            h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Type de section')]), h('select', { class: 'select select-bordered w-full', value: String(props.target.section.columnCount), onChange: (e: Event) => {
              const next = Number((e.target as HTMLSelectElement).value) as SectionColumnCount
              props.target.section.columnCount = next
              while (props.target.section.columns.length < next) props.target.section.columns.push(createEmptyContentBlock())
              props.target.section.columns = props.target.section.columns.slice(0, next)
            } }, SECTION_COLUMN_COUNTS.map(count => h('option', { value: String(count) }, SECTION_COLUMN_COUNT_LABELS[count])))]),
            h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
              h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Largeur du container')]), h('select', { class: 'select select-bordered w-full', value: props.target.section.containerWidth, onChange: (e: Event) => { props.target.section.containerWidth = (e.target as HTMLSelectElement).value as any } }, SECTION_CONTAINER_WIDTHS.map(w => h('option', { value: w }, SECTION_CONTAINER_WIDTH_LABELS[w])))]),
              h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Alignement vertical des colonnes dans la section')]), h('select', { class: 'select select-bordered w-full', value: props.target.section.contentVerticalAlign, onChange: (e: Event) => { props.target.section.contentVerticalAlign = (e.target as HTMLSelectElement).value as any } }, VERTICAL_ALIGNS.map(a => h('option', { value: a }, a)))])
            ]),
            props.target.section.columnCount === 2 ? h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'toggle toggle-primary', checked: props.target.section.reverseOnDesktop, onChange: (e: Event) => { props.target.section.reverseOnDesktop = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, 'Inverser sur desktop')]) : null,
            standaloneGroup('beforeItems', 'Éléments au-dessus des colonnes'),
            standaloneGroup('afterItems', 'Éléments en-dessous des colonnes')
          ])
        ]) : null,
        tab.value === 'background' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 shadow-sm' }, [
          h('div', { class: 'space-y-4' }, [
            h(ThemeColorPicker, { label: 'Fond de section', modelValue: props.target.section.backgroundColor || null, defaultToken: 'base-100', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.target.section.backgroundColor = val } }),
            h(AdminPageBuilderSectionBackgroundFields, { section: props.target.section })
          ])
        ]) : null
      ])
    ])
  }
})
</script>
