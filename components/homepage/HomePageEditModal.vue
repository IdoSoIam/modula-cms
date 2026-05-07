<template>
  <dialog class="modal" :class="{ 'modal-open': open }">
    <div class="modal-box max-w-3xl">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <div class="text-sm opacity-60">Mode édition</div>
          <h3 class="text-xl font-bold">{{ target?.label }}</h3>
        </div>
        <button type="button" class="btn btn-sm btn-circle btn-ghost" @click="$emit('close')">✕</button>
      </div>

      <div v-if="target" class="space-y-4">
        <template v-if="target.kind === 'hero'">
          <div class="form-control">
            <label class="label"><span class="label-text">Image de fond</span></label>
            <ImageInput v-model="target.hero.backgroundImageUrl" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Largeur du hero</span></label>
            <select v-model="target.hero.containerWidth" class="select select-bordered w-full">
              <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">
                {{ SECTION_CONTAINER_WIDTH_LABELS[width] }}
              </option>
            </select>
          </div>
          <LocalizedTextFields v-model="target.hero.badge" v-model:size="target.hero.badgeSize" label="Badge" />
          <LocalizedTextFields v-model="target.hero.title" v-model:size="target.hero.titleSize" label="Titre" />
          <LocalizedTextFields v-model="target.hero.text" v-model:size="target.hero.textSize" label="Texte" multiline />
        </template>

        <template v-else-if="target.kind === 'section'">
          <div class="form-control">
            <label class="label"><span class="label-text">Type</span></label>
            <div class="rounded-xl border border-base-300 bg-base-200 px-4 py-3 text-sm">
              {{ target.section.type === 'two-columns' ? '2 colonnes' : '1 colonne' }}
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Largeur du container</span></label>
            <select v-model="target.section.containerWidth" class="select select-bordered w-full">
              <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">
                {{ SECTION_CONTAINER_WIDTH_LABELS[width] }}
              </option>
            </select>
          </div>
          <ThemeColorPicker v-model="target.section.backgroundColor" label="Fond de section" default-token="base-100" />
          <label v-if="target.section.type === 'two-columns'" class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
            <input v-model="target.section.reverseOnDesktop" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">Inverser sur desktop</span>
          </label>
        </template>

        <template v-else-if="target.kind === 'column'">
          <template v-if="target.column.type === 'content'">
            <div class="form-control">
              <label class="label"><span class="label-text">Alignement horizontal</span></label>
              <select v-model="target.column.align" class="select select-bordered w-full">
                <option v-for="align in CONTENT_ALIGNS" :key="align" :value="align">{{ align }}</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Alignement vertical</span></label>
              <select v-model="target.column.verticalAlign" class="select select-bordered w-full">
                <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
              </select>
            </div>
            <ThemeColorPicker v-model="target.column.textColor" label="Couleur du texte de la colonne" default-token="base-content" />
            <LocalizedTextFields v-model="target.column.badge" v-model:size="target.column.badgeSize" label="Badge" />
            <LocalizedTextFields v-model="target.column.title" v-model:size="target.column.titleSize" label="Titre" />
            <LocalizedTextFields v-model="target.column.text" v-model:size="target.column.textSize" label="Texte" multiline />
          </template>
          <template v-else>
            <div class="form-control">
              <label class="label"><span class="label-text">Image</span></label>
              <ImageInput v-model="target.column.imageUrl" />
            </div>
            <LocalizedTextFields v-model="target.column.alt" label="Alt" />
            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-control">
                <label class="label"><span class="label-text">Ratio</span></label>
                <select v-model="target.column.aspect" class="select select-bordered w-full">
                  <option v-for="aspect in IMAGE_ASPECTS" :key="aspect" :value="aspect">{{ aspect }}</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Placement</span></label>
                <select v-model="target.column.fit" class="select select-bordered w-full">
                  <option v-for="fit in IMAGE_FITS" :key="fit" :value="fit">{{ fit }}</option>
                </select>
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Alignement vertical</span></label>
                <select v-model="target.column.verticalAlign" class="select select-bordered w-full">
                  <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
                </select>
              </div>
            </div>
            <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
              <input v-model="target.column.framed" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">Afficher l’image dans une carte</span>
            </label>
            <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
              <input v-model="target.column.enlarge" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">Forcer un affichage plus grand</span>
            </label>
          </template>
        </template>

        <template v-else-if="target.kind === 'card'">
          <AdminIconPicker v-model="target.card.icon" />
          <div class="form-control">
            <label class="label"><span class="label-text">Taille de la carte</span></label>
            <select v-model="target.card.size" class="select select-bordered w-full">
              <option v-for="size in CARD_SIZES" :key="size" :value="size">{{ CARD_SIZE_LABELS[size] }}</option>
            </select>
          </div>
          <ThemeColorPicker v-model="target.card.backgroundColor" label="Fond de la carte" default-token="base-200" />
          <ThemeColorPicker v-model="target.card.textColor" label="Texte de la carte" default-token="base-content" />
          <ThemeColorPicker v-model="target.card.iconColor" label="Couleur de l’icône" default-token="primary" />
          <ThemeColorPicker v-model="target.card.iconBackgroundColor" label="Fond de l’icône" default-token="transparent" />
          <ThemeColorPicker v-model="target.card.borderColor" label="Bordure de la carte" default-token="base-300" />
          <LocalizedTextFields v-model="target.card.title" v-model:size="target.card.titleSize" label="Titre" />
          <LocalizedTextFields v-model="target.card.text" v-model:size="target.card.textSize" label="Texte" multiline />
        </template>

        <template v-else-if="target.kind === 'button'">
          <LocalizedTextFields v-model="target.button.label" label="Label" />
          <div class="form-control">
            <label class="label"><span class="label-text">Lien</span></label>
            <input v-model="target.button.href" class="input input-bordered w-full" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Style</span></label>
            <select v-model="target.button.tone" class="select select-bordered w-full">
              <option v-for="tone in BUTTON_TONES" :key="tone" :value="tone">{{ tone }}</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Taille du bouton</span></label>
            <select v-model="target.button.size" class="select select-bordered w-full">
              <option v-for="size in BUTTON_SIZES" :key="size" :value="size">{{ BUTTON_SIZE_LABELS[size] }}</option>
            </select>
          </div>
          <ThemeColorPicker v-model="target.button.backgroundColor" label="Fond du bouton" default-token="primary" />
          <ThemeColorPicker v-model="target.button.textColor" label="Texte du bouton" default-token="primary-content" />
          <ThemeColorPicker v-model="target.button.borderColor" label="Bordure du bouton" default-token="transparent" />
        </template>

        <template v-else-if="target.kind === 'text'">
          <LocalizedTextFields
            v-model="target.text"
            v-model:size="target.fontSize"
            :label="target.label"
            :multiline="target.multiline === true"
          />
        </template>
      </div>

      <div class="modal-action">
        <button type="button" class="btn" @click="$emit('close')">Fermer</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @click.prevent="$emit('close')">
      <button type="button">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { defineComponent, h, type PropType } from 'vue'
import AdminIconPicker from '~/components/admin/IconPicker.vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import type { HomePageEditTarget } from '~/shared/homePageEditor'
import {
  BUTTON_TONES,
  BUTTON_SIZE_LABELS,
  BUTTON_SIZES,
  CARD_SIZE_LABELS,
  CARD_SIZES,
  CONTENT_ALIGNS,
  IMAGE_ASPECTS,
  IMAGE_FITS,
  SECTION_CONTAINER_WIDTH_LABELS,
  SECTION_CONTAINER_WIDTHS,
  TYPOGRAPHY_SIZE_LABELS,
  TYPOGRAPHY_SIZES,
  VERTICAL_ALIGNS
} from '~/shared/homePage'

defineProps<{
  open: boolean
  target: HomePageEditTarget | null
}>()

defineEmits<{
  close: []
}>()

const LocalizedTextFields = defineComponent({
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
          props.size !== undefined
            ? h('select', {
                class: 'select select-xs select-bordered w-auto min-w-20',
                value: props.size?.value ?? props.size,
                onChange: (event: Event) => {
                  const value = (event.target as HTMLSelectElement).value
                  if (props.size && typeof props.size === 'object' && 'value' in props.size) {
                    props.size.value = value
                  } else {
                    emit('update:size', value)
                  }
                }
              }, TYPOGRAPHY_SIZES.map(size => h('option', { value: size }, TYPOGRAPHY_SIZE_LABELS[size])))
            : null
        ]),
        h('div', { class: 'tabs tabs-box tabs-xs' }, [
          h('button', { class: ['tab', lang.value === 'fr' ? 'tab-active' : ''], onClick: () => lang.value = 'fr' }, 'FR'),
          h('button', { class: ['tab', lang.value === 'en' ? 'tab-active' : ''], onClick: () => lang.value = 'en' }, 'EN')
        ])
      ]),
      props.multiline
        ? h('textarea', {
            class: 'textarea textarea-bordered w-full',
            rows: 4,
            value: props.modelValue[lang.value],
            onInput: (event: Event) => { props.modelValue[lang.value] = (event.target as HTMLTextAreaElement).value }
          })
        : h('input', {
            class: 'input input-bordered w-full',
            value: props.modelValue[lang.value],
            onInput: (event: Event) => { props.modelValue[lang.value] = (event.target as HTMLInputElement).value }
          })
    ])
  }
})
</script>
