<template>
  <div class="space-y-4">
    <AdminIconPicker v-model="card.icon" />

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

    <AdminHomepageTranslationTabs
      :model-value="card.title"
      :size="card.titleSize"
      label="Titre"
      @update:size="card.titleSize = $event as typeof card.titleSize"
    />
    <AdminHomepageTranslationTabs
      :model-value="card.text"
      :size="card.textSize"
      label="Texte"
      multiline
      @update:size="card.textSize = $event as typeof card.textSize"
    />

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
      <AdminHomepageButtonFields v-if="card.primaryButton" :button="card.primaryButton" />
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
      <AdminHomepageButtonFields v-if="card.secondaryButton" :button="card.secondaryButton" />
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminIconPicker from '~/components/admin/IconPicker.vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import type { HomePageCard } from '~/shared/homePage'
import { CARD_SIZE_LABELS, CARD_SIZES, createEmptyButton } from '~/shared/homePage'

defineProps<{
  card: HomePageCard
}>()
</script>
