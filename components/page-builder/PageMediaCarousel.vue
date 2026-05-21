<template>
  <div
    ref="rootRef"
    class="relative h-full w-full overflow-hidden"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <template v-if="settings.animation === 'fade'">
      <div
        v-for="(slide, slideIndex) in slides"
        :key="slide.id"
        class="absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none"
        :class="currentIndex === slideIndex ? 'z-[1] opacity-100' : 'pointer-events-none opacity-0'"
      >
        <button
          v-if="interactive"
          type="button"
          class="block h-full w-full cursor-zoom-in"
          :aria-label="slideButtonLabel(slideIndex)"
          @click="openViewer(slideIndex)"
        >
          <AppImage
            :src="slide.imageUrl"
            :alt="pickLocalizedText(locale, slide.alt)"
            class="h-full w-full"
            :class="mediaClass(slide.fit, slide.verticalAlign)"
            :width="baseWidth"
            :sizes="sizes"
            :loading="imageLoading(slideIndex)"
            :fetchpriority="imageFetchPriority(slideIndex)"
          />
        </button>
        <div v-else class="h-full w-full">
          <AppImage
            :src="slide.imageUrl"
            :alt="pickLocalizedText(locale, slide.alt)"
            class="h-full w-full"
            :class="mediaClass(slide.fit, slide.verticalAlign)"
            :width="baseWidth"
            :sizes="sizes"
            :loading="imageLoading(slideIndex)"
            :fetchpriority="imageFetchPriority(slideIndex)"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div
        class="flex h-full transform-gpu"
        :class="trackTransitionClass"
        :style="slideTrackStyle"
        @transitionend="handleSlideTransitionEnd"
      >
        <div
          v-for="(slide, slideIndex) in renderedSlides"
          :key="`${slide.id}-${slideIndex}`"
          class="h-full shrink-0 grow-0"
          :style="slideStyle"
        >
          <button
            v-if="interactive"
            type="button"
            class="block h-full w-full cursor-zoom-in"
            :aria-label="slideButtonLabel(currentIndex)"
            @click="openViewer(currentIndex)"
          >
            <AppImage
              :src="slide.imageUrl"
              :alt="pickLocalizedText(locale, slide.alt)"
              class="h-full w-full"
              :class="mediaClass(slide.fit, slide.verticalAlign)"
              :width="baseWidth"
              :sizes="sizes"
              :loading="imageLoading(slideIndex)"
              :fetchpriority="imageFetchPriority(slideIndex)"
            />
          </button>
          <div v-else class="h-full w-full">
            <AppImage
              :src="slide.imageUrl"
              :alt="pickLocalizedText(locale, slide.alt)"
              class="h-full w-full"
              :class="mediaClass(slide.fit, slide.verticalAlign)"
              :width="baseWidth"
              :sizes="sizes"
              :loading="imageLoading(slideIndex)"
              :fetchpriority="imageFetchPriority(slideIndex)"
            />
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="overlayStyle"
      class="pointer-events-none absolute inset-0"
      :class="overlayBlur ? 'md:backdrop-blur-sm' : ''"
      :style="overlayStyle"
    />

    <div
      v-if="settings.showDots && slides.length > 1"
      class="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
    >
      <button
        v-for="(slide, slideIndex) in slides"
        :key="`${slide.id}-nav`"
        type="button"
        class="pointer-events-auto btn btn-xs btn-circle border-white/40 bg-black/25 text-white hover:bg-black/45"
        :class="currentIndex === slideIndex ? 'ring-2 ring-white/70' : ''"
        :aria-label="dotButtonLabel(slideIndex)"
        @click="goTo(slideIndex)"
      />
    </div>

    <div
      v-if="settings.showArrows && slides.length > 1"
      class="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between px-4"
    >
      <button
        type="button"
        class="pointer-events-auto btn btn-circle btn-sm border-white/40 bg-black/25 text-white hover:bg-black/45"
        aria-label="Image précédente"
        @click="prev"
      >
        <Icon name="mdi:chevron-left" size="18" />
      </button>
      <button
        type="button"
        class="pointer-events-auto btn btn-circle btn-sm border-white/40 bg-black/25 text-white hover:bg-black/45"
        aria-label="Image suivante"
        @click="next"
      >
        <Icon name="mdi:chevron-right" size="18" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {
  PageBuilderSectionBackgroundCarouselSettings,
  PageBuilderSectionBackgroundCarouselSlide
} from '~/shared/pageBuilder'
import { pickLocalizedText } from '~/shared/pageBuilder'

const props = defineProps<{
  slides: PageBuilderSectionBackgroundCarouselSlide[]
  settings: PageBuilderSectionBackgroundCarouselSettings
  locale: string
  overlayStyle?: Record<string, string> | null
  overlayBlur?: boolean
  interactive?: boolean
  priority?: boolean
  baseWidth?: number | string
  sizes?: string
}>()

const emit = defineEmits<{
  open: [index: number]
}>()

const currentIndex = ref(0)
const visualIndex = ref(0)
const isTransitionEnabled = ref(true)
const hovering = ref(false)
const isVisible = ref(true)
const rootRef = ref<HTMLElement | null>(null)
let autoplayTimer: ReturnType<typeof setInterval> | null = null
let visibilityObserver: IntersectionObserver | null = null

const useInfiniteSlideMode = computed(() =>
  props.settings.animation === 'slide'
  && props.settings.infinite
  && props.slides.length > 1
)

const renderedSlides = computed<PageBuilderSectionBackgroundCarouselSlide[]>(() => {
  if (!props.slides.length) return []
  if (!useInfiniteSlideMode.value) return props.slides
  const first = props.slides[0]
  const last = props.slides[props.slides.length - 1]
  if (!first || !last) return props.slides
  return [last, ...props.slides, first]
})

const trackTransitionClass = computed(() =>
  isTransitionEnabled.value ? 'transition-transform duration-500 ease-out motion-reduce:transition-none' : ''
)

const slideWidthPercent = computed(() =>
  renderedSlides.value.length ? 100 / renderedSlides.value.length : 100
)

const slideTrackStyle = computed(() => ({
  width: `${renderedSlides.value.length * 100}%`,
  transform: `translateX(-${visualIndex.value * slideWidthPercent.value}%)`
}))

const slideStyle = computed(() => ({
  width: `${slideWidthPercent.value}%`
}))

const mediaClass = (fit: string, verticalAlign: string) => {
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'
  const alignClass = verticalAlign === 'start'
    ? 'object-top'
    : verticalAlign === 'end'
      ? 'object-bottom'
      : 'object-center'
  return `${fitClass} ${alignClass}`
}

const openViewer = (index: number) => {
  if (!props.interactive) return
  emit('open', index)
}

const prioritySlideIndex = computed(() => {
  if (!props.priority || !props.slides.length) return -1
  return props.settings.animation === 'slide' && useInfiniteSlideMode.value ? 1 : 0
})

const imageLoading = (slideIndex: number) => slideIndex === prioritySlideIndex.value ? 'eager' : 'lazy'
const imageFetchPriority = (slideIndex: number) => slideIndex === prioritySlideIndex.value ? 'high' : 'auto'
const slideButtonLabel = (slideIndex: number) => `Ouvrir l'image ${slideIndex + 1}`
const dotButtonLabel = (slideIndex: number) => `Afficher l'image ${slideIndex + 1}`

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

const snapWithoutAnimation = (index: number) => {
  isTransitionEnabled.value = false
  visualIndex.value = index
  if (import.meta.client) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isTransitionEnabled.value = true
      })
    })
  }
}

const syncVisualIndex = () => {
  if (!props.slides.length) {
    currentIndex.value = 0
    visualIndex.value = 0
    return
  }

  if (currentIndex.value >= props.slides.length) {
    currentIndex.value = 0
  }

  snapWithoutAnimation(useInfiniteSlideMode.value ? currentIndex.value + 1 : currentIndex.value)
}

const goTo = (index: number) => {
  if (!props.slides.length) return
  const total = props.slides.length
  const normalized = ((index % total) + total) % total
  currentIndex.value = normalized
  visualIndex.value = useInfiniteSlideMode.value ? normalized + 1 : normalized
}

const next = () => {
  if (!props.slides.length) return
  const total = props.slides.length
  const normalized = (currentIndex.value + 1) % total
  currentIndex.value = normalized

  if (useInfiniteSlideMode.value && normalized === 0) {
    visualIndex.value = total + 1
    return
  }

  visualIndex.value = useInfiniteSlideMode.value ? normalized + 1 : normalized
}

const prev = () => {
  if (!props.slides.length) return
  const total = props.slides.length
  const normalized = (currentIndex.value - 1 + total) % total
  currentIndex.value = normalized

  if (useInfiniteSlideMode.value && normalized === total - 1) {
    visualIndex.value = 0
    return
  }

  visualIndex.value = useInfiniteSlideMode.value ? normalized + 1 : normalized
}

const handleSlideTransitionEnd = () => {
  if (!useInfiniteSlideMode.value || !props.slides.length) return
  const total = props.slides.length

  if (visualIndex.value === 0) {
    snapWithoutAnimation(total)
  } else if (visualIndex.value === total + 1) {
    snapWithoutAnimation(1)
  }
}

const startAutoplay = () => {
  stopAutoplay()
  if (!import.meta.client || !props.settings.autoplay || props.slides.length < 2 || !isVisible.value) return

  autoplayTimer = setInterval(() => {
    if (hovering.value) return
    next()
  }, props.settings.intervalMs)
}

watch(
  () => [
    props.settings.animation,
    props.settings.autoplay,
    props.settings.infinite,
    props.settings.intervalMs,
    props.slides.length,
    isVisible.value
  ],
  () => {
    syncVisualIndex()
    if (import.meta.client) {
      startAutoplay()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (import.meta.client && rootRef.value) {
    visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible.value = Boolean(entry?.isIntersecting && entry.intersectionRatio > 0.35)
      },
      { threshold: [0, 0.35, 0.6] }
    )
    visibilityObserver.observe(rootRef.value)
  }
  syncVisualIndex()
  startAutoplay()
})

onBeforeUnmount(() => {
  stopAutoplay()
  visibilityObserver?.disconnect()
})
</script>
