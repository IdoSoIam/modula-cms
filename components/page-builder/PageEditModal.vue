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
          <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="$emit('close')">x</button>
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
          class="absolute bottom-2 right-2 z-20 h-5 w-5 cursor-se-resize rounded bg-base-300/70"
          aria-label="Redimensionner"
          @pointerdown.stop="startResize"
        />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { defineComponent, h, resolveComponent, type PropType } from 'vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import AdminIconPicker from '~/components/admin/IconPicker.vue'
import AdminPageBuilderCarouselFields from '~/components/admin/page-builder/CarouselFields.vue'
import AdminPageBuilderSectionBackgroundFields from '~/components/admin/page-builder/SectionBackgroundFields.vue'
import type { PageBuilderEditTarget } from '~/shared/pageBuilderEditor'
import type { PageBuilderButton, PageBuilderCard, PageBuilderColumnItem, SectionColumnCount, ThemeColorSelection } from '~/shared/pageBuilder'
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
  createEmptyContentBlock,
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
  SECTION_COLUMN_COUNTS,
  SECTION_COLUMN_COUNT_LABELS,
  SECTION_CONTAINER_WIDTH_LABELS,
  SECTION_CONTAINER_WIDTHS,
  TYPOGRAPHY_SIZE_LABELS,
  TYPOGRAPHY_SIZES,
  VERTICAL_ALIGNS
} from '~/shared/pageBuilder'

const props = defineProps({
  open: { type: Boolean, required: true },
  target: { type: Object as PropType<PageBuilderEditTarget | null>, default: null }
})

defineEmits<{ close: [] }>()

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

const TranslationFields = defineComponent({
  props: {
    modelValue: { type: Object as PropType<{ fr: string; en: string }>, required: true },
    label: { type: String, required: true },
    size: { type: [String, Object] as PropType<any>, default: undefined },
    multiline: { type: Boolean, default: false }
  },
  emits: ['update:size'],
  setup(props, { emit }) {
    const lang = ref<'fr' | 'en'>('fr')
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
        h('div', { class: 'tabs tabs-box tabs-xs' }, [
          h('button', { type: 'button', class: ['tab cursor-pointer', lang.value === 'fr' ? 'tab-active' : 'border-0'], onClick: () => { lang.value = 'fr' } }, 'FR'),
          h('button', { type: 'button', class: ['tab cursor-pointer', lang.value === 'en' ? 'tab-active' : 'border-0'], onClick: () => { lang.value = 'en' } }, 'EN')
        ])
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
    const tab = ref<'content' | 'style' | 'buttons'>('content')
    return () => h('div', { class: 'space-y-4' }, [
      h('div', { class: 'flex justify-end gap-2' }, [
        h('button', { type: 'button', class: 'btn btn-xs', disabled: currentCardIndex(props.target) === 0, onClick: () => moveItem(props.target.parentCards, currentCardIndex(props.target), -1) }, 'Monter'),
        h('button', { type: 'button', class: 'btn btn-xs', disabled: currentCardIndex(props.target) === props.target.parentCards.length - 1, onClick: () => moveItem(props.target.parentCards, currentCardIndex(props.target), 1) }, 'Descendre'),
        h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => duplicateAt(props.target.parentCards, currentCardIndex(props.target), duplicatePageBuilderCard) }, 'Dupliquer'),
        h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => removeAt(props.target.parentCards, currentCardIndex(props.target)) }, 'Supprimer')
      ]),
      h('div', { class: 'space-y-0' }, [
        h('div', { class: 'tabs tabs-lift flex-wrap' }, [
        h('button', { type: 'button', class: ['tab cursor-pointer', tab.value === 'content' ? 'tab-active' : 'border-0'], onClick: () => { tab.value = 'content' } }, 'Contenu'),
        h('button', { type: 'button', class: ['tab cursor-pointer', tab.value === 'style' ? 'tab-active' : 'border-0'], onClick: () => { tab.value = 'style' } }, 'Style'),
        h('button', { type: 'button', class: ['tab cursor-pointer', tab.value === 'buttons' ? 'tab-active' : 'border-0'], onClick: () => { tab.value = 'buttons' } }, 'Boutons')
        ]),
      tab.value === 'content' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 shadow-sm' }, [
        h('div', { class: 'space-y-4' }, [
        h(AdminIconPicker, { modelValue: props.target.card.icon || '', 'onUpdate:modelValue': (val: string) => { props.target.card.icon = val } }),
        h(TranslationFields, { modelValue: props.target.card.title, label: 'Titre', size: props.target.card.titleSize, 'onUpdate:size': (val: string) => { props.target.card.titleSize = val as any } }),
        h(TranslationFields, { modelValue: props.target.card.text, label: 'Texte', size: props.target.card.textSize, multiline: true, 'onUpdate:size': (val: string) => { props.target.card.textSize = val as any } })
        ])
      ]) : null,
      tab.value === 'style' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 shadow-sm' }, [
        h('div', { class: 'space-y-4' }, [
        h('div', { class: 'grid gap-4 md:grid-cols-2' }, [
          h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Taille de la carte')]), h('select', { class: 'select select-bordered w-full', value: props.target.card.size, onChange: (e: Event) => { props.target.card.size = (e.target as HTMLSelectElement).value as any } }, CARD_SIZES.map(s => h('option', { value: s }, CARD_SIZE_LABELS[s])))]),
          h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'toggle toggle-primary toggle-sm', checked: props.target.card.backdropBlur === true, onChange: (e: Event) => { props.target.card.backdropBlur = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, 'Background blur')])
        ]),
        h(ThemeColorPicker, { label: 'Fond de la carte', modelValue: props.target.card.backgroundColor || null, defaultToken: 'base-200', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.target.card.backgroundColor = val } }),
        h(ThemeColorPicker, { label: 'Texte de la carte', modelValue: props.target.card.textColor || null, defaultToken: 'base-content', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.target.card.textColor = val } }),
        h(ThemeColorPicker, { label: "Couleur de l'icone", modelValue: props.target.card.iconColor || null, defaultToken: 'primary', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.target.card.iconColor = val } }),
        h(ThemeColorPicker, { label: "Fond de l'icone", modelValue: props.target.card.iconBackgroundColor || null, defaultToken: 'transparent', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.target.card.iconBackgroundColor = val } }),
        h(ThemeColorPicker, { label: 'Bordure de la carte', modelValue: props.target.card.borderColor || null, defaultToken: 'base-300', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.target.card.borderColor = val } })
        ])
      ]) : null,
      tab.value === 'buttons' ? h('div', { class: 'rounded-b-box rounded-tr-box border border-base-300 bg-base-100 p-4 shadow-sm' }, [
        h('div', { class: 'space-y-4' }, [
        h('div', { class: 'rounded-xl border border-base-300 bg-base-100 p-4' }, [
          h('div', { class: 'mb-3 flex items-center justify-between gap-2' }, [h('div', { class: 'font-medium' }, 'Bouton principal'), !props.target.card.primaryButton ? h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => { props.target.card.primaryButton = createEmptyButton() } }, 'Ajouter') : h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => { props.target.card.primaryButton = null } }, 'Retirer')]),
          props.target.card.primaryButton ? h(ButtonEditor, { button: props.target.card.primaryButton }) : null
        ]),
        h('div', { class: 'rounded-xl border border-base-300 bg-base-100 p-4' }, [
          h('div', { class: 'mb-3 flex items-center justify-between gap-2' }, [h('div', { class: 'font-medium' }, 'Bouton secondaire'), !props.target.card.secondaryButton ? h('button', { type: 'button', class: 'btn btn-xs btn-outline', onClick: () => { props.target.card.secondaryButton = createEmptyButton() } }, 'Ajouter') : h('button', { type: 'button', class: 'btn btn-xs btn-outline btn-error', onClick: () => { props.target.card.secondaryButton = null } }, 'Retirer')]),
          props.target.card.secondaryButton ? h(ButtonEditor, { button: props.target.card.secondaryButton }) : null
        ])
        ])
      ]) : null
      ])
    ])
  }
})

const ItemEditor = defineComponent({
  props: { target: { type: Object as PropType<Extract<PageBuilderEditTarget, { kind: 'item' }>>, required: true } },
  setup(props) {
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
          h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'toggle toggle-primary', checked: item.framed, onChange: (e: Event) => { item.framed = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, "Afficher l'image dans une carte")]),
          h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'toggle toggle-primary', checked: item.enlarge, onChange: (e: Event) => { item.enlarge = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, 'Forcer un affichage plus grand')])
        ])
      }

      if (item.type === 'carousel') {
        return h('div', { class: 'space-y-4' }, [
          header,
          h(AdminPageBuilderCarouselFields, { carousel: item })
        ])
      }

      const cardsItem = item as Extract<PageBuilderColumnItem, { type: 'cards' }>
      return h('div', { class: 'space-y-4' }, [
        header,
        h('div', { class: 'form-control' }, [h('label', { class: 'label' }, [h('span', { class: 'label-text' }, 'Affichage des cartes')]), h('select', { class: 'select select-bordered w-full', value: cardsItem.display, onChange: (e: Event) => { cardsItem.display = (e.target as HTMLSelectElement).value as any } }, CARDS_DISPLAYS.map(d => h('option', { value: d }, CARDS_DISPLAY_LABELS[d])))]),
        h('div', { class: 'flex justify-end' }, [h('button', { type: 'button', class: 'btn btn-sm btn-primary', onClick: () => cardsItem.cards.push(createEmptyCard(createId('card'))) }, 'Ajouter une carte')])
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
      h(ThemeColorPicker, { label: 'Couleur du texte de la colonne', modelValue: props.target.column.textColor || null, defaultToken: 'base-content', 'onUpdate:modelValue': (val: ThemeColorSelection | null) => { props.target.column.textColor = val } }),
      h('div', { class: 'rounded-2xl border border-base-300 bg-base-200 p-4' }, [
        h('div', { class: 'mb-3 font-medium' }, 'Ajouter un element'),
        h('div', { class: 'flex flex-wrap gap-2' }, [
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createBadgeItem(createId('badge'))) }, 'Badge'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createTitleItem(createId('title'))) }, 'Titre'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createTextItem(createId('text'))) }, 'Texte'),
          h('button', { type: 'button', class: 'btn btn-sm btn-outline', onClick: () => props.target.column.items.push(createButtonsItem(createId('buttons'))) }, 'Boutons'),
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
            props.target.section.columnCount === 2 ? h('label', { class: 'label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3' }, [h('input', { type: 'checkbox', class: 'toggle toggle-primary', checked: props.target.section.reverseOnDesktop, onChange: (e: Event) => { props.target.section.reverseOnDesktop = (e.target as HTMLInputElement).checked } }), h('span', { class: 'label-text' }, 'Inverser sur desktop')]) : null
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
