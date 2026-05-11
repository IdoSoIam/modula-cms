<template>
  <div class="space-y-4">
    <div class="grid gap-4 md:grid-cols-2">
      <div class="form-control">
        <label class="label"><span class="label-text">Ratio</span></label>
        <select v-model="carousel.aspect" class="select select-bordered w-full">
          <option v-for="aspect in IMAGE_ASPECTS" :key="aspect" :value="aspect">{{ aspect }}</option>
        </select>
      </div>
    </div>

    <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
      <input v-model="carousel.framed" type="checkbox" class="toggle toggle-primary" />
      <span class="label-text">Afficher le carousel dans une carte</span>
    </label>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
        <input :checked="carousel.settings.autoplay" type="checkbox" class="toggle toggle-primary" @change="carousel.settings.autoplay = ($event.target as HTMLInputElement).checked">
        <span class="label-text">Defilement automatique</span>
      </label>

      <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
        <input :checked="carousel.settings.infinite" type="checkbox" class="toggle toggle-primary" @change="carousel.settings.infinite = ($event.target as HTMLInputElement).checked">
        <span class="label-text">Boucle infinie</span>
      </label>

      <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
        <input :checked="carousel.settings.showArrows" type="checkbox" class="toggle toggle-primary" @change="carousel.settings.showArrows = ($event.target as HTMLInputElement).checked">
        <span class="label-text">Fleches</span>
      </label>

      <label class="label cursor-pointer justify-start gap-2 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
        <input :checked="carousel.settings.showDots" type="checkbox" class="toggle toggle-primary" @change="carousel.settings.showDots = ($event.target as HTMLInputElement).checked">
        <span class="label-text">Dots</span>
      </label>

      <div class="form-control md:col-span-2">
        <label class="label">
          <span class="label-text">Vitesse</span>
          <span class="label-text-alt">{{ carousel.settings.intervalMs }} ms</span>
          &nbsp;
        </label>
        <input
          :value="carousel.settings.intervalMs"
          type="range"
          min="1500"
          max="12000"
          step="500"
          class="range range-primary range-sm"
          @input="carousel.settings.intervalMs = Number(($event.target as HTMLInputElement).value)"
        >
      </div>

      <div class="form-control md:col-span-2">
        <label class="label"><span class="label-text">Animation</span></label>
        <select v-model="carousel.settings.animation" class="select select-bordered w-full">
          <option v-for="animation in CAROUSEL_ANIMATIONS" :key="animation" :value="animation">
            {{ CAROUSEL_ANIMATION_LABELS[animation] }}
          </option>
        </select>
      </div>
    </div>

    <div class="flex justify-end">
      <button class="btn btn-sm btn-primary" @click="addSlide">
        Ajouter un slide
      </button>
    </div>

    <div class="space-y-4">
      <div
        v-for="(slide, index) in carousel.slides"
        :key="slide.id"
        class="rounded-xl border border-base-300 bg-base-200 p-4"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div class="font-medium">Slide {{ index + 1 }}</div>
          <div class="flex flex-wrap gap-2">
            <button class="btn btn-xs" :disabled="index === 0" @click="moveSlide(index, -1)">Monter</button>
            <button class="btn btn-xs" :disabled="index === carousel.slides.length - 1" @click="moveSlide(index, 1)">Descendre</button>
            <button class="btn btn-xs btn-outline btn-error" @click="removeSlide(index)">Supprimer</button>
          </div>
        </div>

        <div class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Image</span></label>
            <ImageInput v-model="slide.imageUrl" />
          </div>

          <AdminHomepageTranslationTabs :model-value="slide.alt" label="Alt" />

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
  </div>
</template>

<script setup lang="ts">
import type { HomePageCarouselItem } from '~/shared/homePage'
import {
  CAROUSEL_ANIMATIONS,
  CAROUSEL_ANIMATION_LABELS,
  createEmptySectionBackgroundSlide,
  IMAGE_ASPECTS,
  IMAGE_FITS,
  VERTICAL_ALIGNS
} from '~/shared/homePage'

const props = defineProps<{
  carousel: HomePageCarouselItem
}>()

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

const moveSlide = (index: number, direction: -1 | 1) => {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= props.carousel.slides.length) return
  const [slide] = props.carousel.slides.splice(index, 1)
  if (!slide) return
  props.carousel.slides.splice(nextIndex, 0, slide)
}

const removeSlide = (index: number) => {
  props.carousel.slides.splice(index, 1)
  if (!props.carousel.slides.length) {
    props.carousel.slides.push(createEmptySectionBackgroundSlide(createId('slide')))
  }
}

const addSlide = () => {
  props.carousel.slides.push(createEmptySectionBackgroundSlide(createId('slide')))
}
</script>
