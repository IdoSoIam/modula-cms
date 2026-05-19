<template>
  <div class="space-y-4">
    <div class="grid gap-4 md:grid-cols-2">
      <div class="form-control">
        <label class="label"><span class="label-text">Taille de la carte</span></label>
        <select v-model="card.size" class="select select-bordered w-full">
          <option v-for="size in CARD_SIZES" :key="size" :value="size">{{ CARD_SIZE_LABELS[size] }}</option>
        </select>
      </div>

      <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
        <input :checked="card.backdropBlur === true" type="checkbox" class="toggle toggle-primary toggle-sm" @change="card.backdropBlur = ($event.target as HTMLInputElement).checked">
        <span class="label-text">Background blur</span>
      </label>
    </div>

    <ThemeColorPicker v-model="card.backgroundColor" label="Fond de la carte" default-token="base-200" />
    <ThemeColorPicker v-model="card.textColor" label="Texte de la carte" default-token="base-content" />
    <ThemeColorPicker v-model="card.iconColor" label="Couleur de l'icone" default-token="primary" />
    <ThemeColorPicker v-model="card.iconBackgroundColor" label="Fond de l'icone" default-token="transparent" />
    <ThemeColorPicker v-model="card.borderColor" label="Bordure de la carte" default-token="base-300" />

    <div class="rounded-xl border border-base-300 bg-base-100 p-4 space-y-4">
      <div class="flex items-center justify-between gap-2">
        <div class="font-medium">Éléments de contenu</div>
        <div class="flex flex-wrap gap-2">
          <button class="btn btn-xs btn-outline" @click="addElement('title')">Ajouter un titre</button>
          <button class="btn btn-xs btn-outline" @click="addElement('text')">Ajouter un texte</button>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="(element, elementIndex) in card.elements"
          :key="element.id"
          class="rounded-xl border border-base-300 bg-base-200/50 p-4 space-y-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="font-medium">
              {{ element.kind === 'title' ? 'Titre' : 'Texte' }} {{ elementIndex + 1 }}
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-xs" :disabled="elementIndex === 0" @click="moveElement(elementIndex, -1)">Monter</button>
              <button type="button" class="btn btn-xs" :disabled="elementIndex === card.elements.length - 1" @click="moveElement(elementIndex, 1)">Descendre</button>
              <button type="button" class="btn btn-xs btn-outline btn-error" @click="card.elements.splice(elementIndex, 1)">Supprimer</button>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="form-control">
              <label class="label"><span class="label-text">Type</span></label>
              <select v-model="element.kind" class="select select-bordered w-full">
                <option v-for="kind in PAGE_BUILDER_CARD_ELEMENT_KINDS" :key="kind" :value="kind">
                  {{ PAGE_BUILDER_CARD_ELEMENT_KIND_LABELS[kind] }}
                </option>
              </select>
            </div>

            <AdminIconPicker v-model="element.icon" />
          </div>

          <div v-if="element.kind === 'text'" class="form-control">
            <label class="label"><span class="label-text">Source du contenu</span></label>
            <select v-model="element.source" class="select select-bordered w-full">
              <option v-for="source in PAGE_BUILDER_CARD_ELEMENT_SOURCES" :key="source" :value="source">
                {{ PAGE_BUILDER_CARD_ELEMENT_SOURCE_LABELS[source] }}
              </option>
            </select>
          </div>

          <AdminPageBuilderTranslationTabs
            v-if="element.kind != PAGE_BUILDER_CARD_ELEMENT_SOURCE_LABELS.custom"
            :model-value="element.title"
            :size="element.titleSize"
            :label="element.kind === 'title' ? 'Titre' : 'Libellé'"
            @update:size="element.titleSize = $event as typeof element.titleSize"
          />

          <AdminPageBuilderTranslationTabs
            v-if="element.kind === 'text' && element.source === 'custom'"
            :model-value="element.text"
            :size="element.textSize"
            label="Texte"
            multiline
            @update:size="element.textSize = $event as typeof element.textSize"
          />
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-base-300 bg-base-100 p-4">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div class="font-medium">Bouton principal</div>
        <button v-if="!card.primaryButton" class="btn btn-xs btn-outline" @click="card.primaryButton = createEmptyButton()">
          Ajouter
        </button>
        <button v-else class="btn btn-xs btn-outline btn-error" @click="card.primaryButton = null">
          Retirer
        </button>
      </div>
      <AdminPageBuilderButtonFields v-if="card.primaryButton" :button="card.primaryButton" />
    </div>

    <div class="rounded-xl border border-base-300 bg-base-100 p-4">
      <div class="mb-3 flex items-center justify-between gap-2">
        <div class="font-medium">Bouton secondaire</div>
        <button v-if="!card.secondaryButton" class="btn btn-xs btn-outline" @click="card.secondaryButton = createEmptyButton()">
          Ajouter
        </button>
        <button v-else class="btn btn-xs btn-outline btn-error" @click="card.secondaryButton = null">
          Retirer
        </button>
      </div>
      <AdminPageBuilderButtonFields v-if="card.secondaryButton" :button="card.secondaryButton" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminIconPicker from '~/components/admin/IconPicker.vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import type { PageBuilderCard } from '~/shared/pageBuilder'
import {
  CARD_SIZE_LABELS,
  CARD_SIZES,
  createEmptyButton,
  createEmptyCardElement,
  PAGE_BUILDER_CARD_ELEMENT_KINDS,
  PAGE_BUILDER_CARD_ELEMENT_KIND_LABELS,
  PAGE_BUILDER_CARD_ELEMENT_SOURCES,
  PAGE_BUILDER_CARD_ELEMENT_SOURCE_LABELS
} from '~/shared/pageBuilder'

const props = defineProps<{
  card: PageBuilderCard
}>()

if (!props.card.elements?.length && (
  props.card.title.fr || props.card.title.en || props.card.text.fr || props.card.text.en || props.card.icon
)) {
  props.card.elements = []
  if (props.card.title.fr || props.card.title.en) {
    props.card.elements.push({
      ...createEmptyCardElement(`${props.card.id}-element-1`, 'title'),
      icon: props.card.icon || '',
      title: props.card.title,
      titleSize: props.card.titleSize
    })
  }
  if (props.card.text.fr || props.card.text.en) {
    props.card.elements.push({
      ...createEmptyCardElement(`${props.card.id}-element-${props.card.elements.length + 1}`, 'text'),
      text: props.card.text,
      textSize: props.card.textSize
    })
  }
}

function addElement(kind: 'title' | 'text') {
  props.card.elements.push(createEmptyCardElement(`${props.card.id}-element-${props.card.elements.length + 1}`, kind))
}

function moveElement(index: number, direction: -1 | 1) {
  const next = index + direction
  if (next < 0 || next >= props.card.elements.length) return
  const [item] = props.card.elements.splice(index, 1)
  if (!item) return
  props.card.elements.splice(next, 0, item)
}
</script>
