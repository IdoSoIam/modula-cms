<template>
  <div class="space-y-4">
    <AdminHomepageTranslationTabs :model-value="button.label" label="Label" />

    <div class="form-control">
      <label class="label"><span class="label-text">Lien</span></label>
      <input v-model="button.href" class="input input-bordered w-full">
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="form-control">
        <label class="label"><span class="label-text">Style</span></label>
        <select v-model="button.tone" class="select select-bordered w-full">
          <option v-for="tone in BUTTON_TONES" :key="tone" :value="tone">{{ tone }}</option>
        </select>
      </div>

      <div class="form-control">
        <label class="label"><span class="label-text">Taille</span></label>
        <select v-model="button.size" class="select select-bordered w-full">
          <option v-for="size in BUTTON_SIZES" :key="size" :value="size">{{ BUTTON_SIZE_LABELS[size] }}</option>
        </select>
      </div>
    </div>

    <ThemeColorPicker v-model="button.backgroundColor" label="Fond du bouton" default-token="primary" />
    <ThemeColorPicker v-model="button.textColor" label="Texte du bouton" default-token="primary-content" />
    <ThemeColorPicker v-model="button.borderColor" label="Bordure du bouton" default-token="transparent" />
  </div>
</template>

<script setup lang="ts">
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import type { HomePageButton } from '~/shared/homePage'
import { BUTTON_SIZE_LABELS, BUTTON_SIZES, BUTTON_TONES } from '~/shared/homePage'

defineProps<{
  button: HomePageButton
}>()
</script>
