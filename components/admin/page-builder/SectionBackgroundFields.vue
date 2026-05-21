<template>
  <div class="space-y-4 rounded-xl border border-base-300 bg-base-100 p-4">
    <div class="form-control">
      <label class="label">
        <span class="label-text">Hauteur minimale de section</span>
        <span class="label-text-alt">{{ section.minHeightPx ? `${section.minHeightPx}px` : 'Aucune' }}</span>
        &nbsp;
      </label>
      <input
        :value="section.minHeightPx ?? 0"
        type="range"
        min="0"
        max="1400"
        step="20"
        class="range range-primary range-sm"
        @input="updateMinHeight(Number(($event.target as HTMLInputElement).value))"
      >
      <div class="mt-2 flex items-center gap-3">
        <input
          class="input input-bordered w-32"
          type="number"
          min="0"
          max="2400"
          step="20"
          :value="section.minHeightPx ?? 0"
          @input="updateMinHeight(Number(($event.target as HTMLInputElement).value))"
        >
        <button type="button" class="btn btn-sm btn-outline" @click="section.minHeightPx = null">
          Sans minimum
        </button>
      </div>
    </div>

    <div class="form-control">
      <label class="label"><span class="label-text">Mode de fond</span></label>
      <select v-model="section.backgroundMode" class="select select-bordered w-full">
        <option v-for="mode in SECTION_BACKGROUND_MODES" :key="mode" :value="mode">
          {{ SECTION_BACKGROUND_MODE_LABELS[mode] }}
        </option>
      </select>
    </div>

    <template v-if="section.backgroundMode === 'image'">
      <div class="form-control">
        <label class="label"><span class="label-text">Image de fond</span></label>
        <ImageInput v-model="section.backgroundImage.imageUrl" />
      </div>

      <AdminPageBuilderTranslationTabs :model-value="section.backgroundImage.alt" label="Alt" />

      <div class="grid gap-4 md:grid-cols-2">
        <div class="form-control">
          <label class="label"><span class="label-text">Placement</span></label>
          <select v-model="section.backgroundImage.fit" class="select select-bordered w-full">
            <option v-for="fit in IMAGE_FITS" :key="fit" :value="fit">{{ fit }}</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">Alignement vertical</span></label>
          <select v-model="section.backgroundImage.verticalAlign" class="select select-bordered w-full">
            <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
          </select>
        </div>
      </div>
    </template>

    <template v-if="section.backgroundMode === 'carousel'">
      <div class="grid gap-4 md:grid-cols-2">
        <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
          <input :checked="section.backgroundCarouselSettings.autoplay" type="checkbox" class="toggle toggle-primary" @change="section.backgroundCarouselSettings.autoplay = ($event.target as HTMLInputElement).checked">
          <span class="label-text">Defilement automatique</span>
        </label>

        <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
          <input :checked="section.backgroundCarouselSettings.infinite" type="checkbox" class="toggle toggle-primary" @change="section.backgroundCarouselSettings.infinite = ($event.target as HTMLInputElement).checked">
          <span class="label-text">Boucle infinie</span>
        </label>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Vitesse</span>
            <span class="label-text-alt">{{ section.backgroundCarouselSettings.intervalMs }} ms</span>
            &nbsp;
          </label>
          <input
            :value="section.backgroundCarouselSettings.intervalMs"
            type="range"
            min="1500"
            max="12000"
            step="500"
            class="range range-primary range-sm"
            @input="section.backgroundCarouselSettings.intervalMs = Number(($event.target as HTMLInputElement).value)"
          >
        </div>

        <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
          <input :checked="section.backgroundCarouselSettings.showArrows" type="checkbox" class="toggle toggle-primary" @change="section.backgroundCarouselSettings.showArrows = ($event.target as HTMLInputElement).checked">
          <span class="label-text">Boutons prev/next</span>
        </label>

        <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
          <input :checked="section.backgroundCarouselSettings.showDots" type="checkbox" class="toggle toggle-primary" @change="section.backgroundCarouselSettings.showDots = ($event.target as HTMLInputElement).checked">
          <span class="label-text">Dots</span>
        </label>

        <div class="form-control md:col-span-2">
          <label class="label"><span class="label-text">Animation</span></label>
          <select v-model="section.backgroundCarouselSettings.animation" class="select select-bordered w-full">
            <option v-for="animation in CAROUSEL_ANIMATIONS" :key="animation" :value="animation">
              {{ CAROUSEL_ANIMATION_LABELS[animation] }}
            </option>
          </select>
        </div>
      </div>

      <div class="flex justify-end">
        <button type="button" class="btn btn-sm btn-primary" @click="addSlide">
          Ajouter un slide
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="(slide, index) in section.backgroundCarousel"
          :key="slide.id"
          class="rounded-xl border border-base-300 bg-base-200 p-4"
        >
          <div class="mb-3 flex flex-wrap items-start justify-between gap-3">
            <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="toggleSlide(slide.id)">
              <div class="flex items-center gap-2">
                <Icon :name="isSlideOpen(slide.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                <div class="font-medium">Slide {{ index + 1 }}</div>
              </div>
              <div class="mt-1 pl-6 text-xs opacity-65">
                {{ slide.alt.fr || slide.alt.en || slide.imageUrl || 'Slide vide' }}
              </div>
            </button>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-xs" :disabled="index === 0" @click="moveSlide(index, -1)">Monter</button>
              <button type="button" class="btn btn-xs" :disabled="index === section.backgroundCarousel.length - 1" @click="moveSlide(index, 1)">Descendre</button>
              <button type="button" class="btn btn-xs btn-outline" @click="duplicateSlide(index)">Dupliquer</button>
              <button type="button" class="btn btn-xs btn-outline btn-error" @click="removeSlide(index)">Supprimer</button>
            </div>
          </div>

          <div v-if="isSlideOpen(slide.id)" class="space-y-4">
            <div class="form-control">
              <label class="label"><span class="label-text">Image</span></label>
              <ImageInput v-model="slide.imageUrl" />
            </div>

            <AdminPageBuilderTranslationTabs :model-value="slide.alt" label="Alt" />

            <div class="grid gap-4 md:grid-cols-2">
              <div class="form-control">
                <label class="label"><span class="label-text">Placement</span></label>
                <select v-model="slide.fit" class="select select-bordered w-full">
                  <option v-for="fit in IMAGE_FITS" :key="fit" :value="fit">{{ fit }}</option>
                </select>
              </div>

              <div class="form-control">
                <label class="label"><span class="label-text">Alignement vertical</span></label>
                <select v-model="slide.verticalAlign" class="select select-bordered w-full">
                  <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="section.backgroundMode !== 'none'">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Largeur chargee</span>
          <span class="label-text-alt">{{ section.backgroundImage.requestedWidthPx ? `${section.backgroundImage.requestedWidthPx}px` : 'Auto' }}</span>
        </label>
        <input
          :value="section.backgroundImage.requestedWidthPx ?? 0"
          type="range"
          min="0"
          max="2200"
          step="20"
          class="range range-primary range-sm"
          @input="updateBackgroundRequestedWidth(Number(($event.target as HTMLInputElement).value))"
        >
        <div class="mt-2 flex items-center gap-3">
          <input
            class="input input-bordered w-32"
            type="number"
            min="0"
            max="2400"
            step="20"
            :value="section.backgroundImage.requestedWidthPx ?? 0"
            @input="updateBackgroundRequestedWidth(Number(($event.target as HTMLInputElement).value))"
          >
          <button type="button" class="btn btn-sm btn-outline" @click="section.backgroundImage.requestedWidthPx = null">
            Auto
          </button>
        </div>
      </div>

      <ThemeColorPicker
        v-model="section.backgroundImage.overlayColor"
        label="Couleur d overlay"
        default-token="neutral"
      />

      <div class="form-control">
        <label class="label">
          <span class="label-text">Opacite de l'overlay</span>
          <span class="label-text-alt">{{ section.backgroundImage.overlayOpacity }}%</span>
          &nbsp;
        </label>
        <input
          :value="section.backgroundImage.overlayOpacity"
          type="range"
          min="0"
          max="100"
          class="range range-primary range-sm"
          @input="section.backgroundImage.overlayOpacity = Number(($event.target as HTMLInputElement).value)"
        >
      </div>

      <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
        <input v-model="section.backgroundImage.blur" type="checkbox" class="toggle toggle-primary">
        <span class="label-text">Blur de l'overlay</span>
      </label>
    </template>
  </div>
</template>

<script setup lang="ts">
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import type { PageBuilderSection } from '~/shared/pageBuilder'
import {
  CAROUSEL_ANIMATIONS,
  CAROUSEL_ANIMATION_LABELS,
  createEmptySectionBackgroundSlide,
  IMAGE_FITS,
  SECTION_BACKGROUND_MODE_LABELS,
  SECTION_BACKGROUND_MODES,
  VERTICAL_ALIGNS
} from '~/shared/pageBuilder'

const props = defineProps<{
  section: PageBuilderSection
}>()

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`
const cloneSlideData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const openSlideIds = ref<string[]>([])

const isSlideOpen = (id: string) => openSlideIds.value.includes(id)

const openSlide = (id: string) => {
  if (!openSlideIds.value.includes(id)) {
    openSlideIds.value = [...openSlideIds.value, id]
  }
}

const toggleSlide = (id: string) => {
  if (isSlideOpen(id)) {
    openSlideIds.value = openSlideIds.value.filter(slideId => slideId !== id)
    return
  }
  openSlide(id)
}

const moveSlide = (index: number, direction: -1 | 1) => {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= props.section.backgroundCarousel.length) return
  const [slide] = props.section.backgroundCarousel.splice(index, 1)
  if (!slide) return
  props.section.backgroundCarousel.splice(nextIndex, 0, slide)
}

const removeSlide = (index: number) => {
  props.section.backgroundCarousel.splice(index, 1)
  if (!props.section.backgroundCarousel.length) {
    props.section.backgroundCarousel.push(createEmptySectionBackgroundSlide(createId('slide')))
  }
}

const addSlide = () => {
  const slide = createEmptySectionBackgroundSlide(createId('slide'))
  props.section.backgroundCarousel.push(slide)
  openSlide(slide.id)
}

const duplicateSlide = (index: number) => {
  const slide = props.section.backgroundCarousel[index]
  if (!slide) return
  const clone = cloneSlideData(slide)
  clone.id = createId('slide')
  props.section.backgroundCarousel.splice(index + 1, 0, clone)
  openSlide(clone.id)
}

const updateMinHeight = (value: number) => {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(2400, Math.round(value))) : 0
  props.section.minHeightPx = normalized > 0 ? normalized : null
}

const updateBackgroundRequestedWidth = (value: number) => {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(2400, Math.round(value))) : 0
  props.section.backgroundImage.requestedWidthPx = normalized > 0 ? normalized : null
}
</script>
