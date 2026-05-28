<template>
  <dialog class="modal" :class="{ 'modal-open': open }" @click.self="emit('close')">
    <div class="modal-box h-screen max-h-screen w-screen max-w-none rounded-none border-0 bg-neutral p-0 text-neutral-content sm:h-[92vh] sm:w-[92vw] sm:max-w-6xl sm:rounded-3xl">
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <div class="min-w-0">
            <div class="truncate text-sm opacity-70">{{ currentSlideIndex + 1 }} / {{ slides.length }}</div>
            <div class="truncate text-sm">{{ currentSlideAlt }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" class="btn btn-circle btn-sm btn-ghost text-white" @click="zoomOut">
              <Icon name="mdi:magnify-minus-outline" size="18" />
            </button>
            <button type="button" class="btn btn-circle btn-sm btn-ghost text-white" @click="resetTransform">
              <Icon name="mdi:image-filter-center-focus-strong" size="18" />
            </button>
            <button type="button" class="btn btn-circle btn-sm btn-ghost text-white" @click="zoomIn">
              <Icon name="mdi:magnify-plus-outline" size="18" />
            </button>
            <button type="button" class="btn btn-circle btn-sm btn-ghost text-white" @click="emit('close')">
              <Icon name="mdi:close" size="18" />
            </button>
          </div>
        </div>

        <div class="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/30">
          <button
            v-if="slides.length > 1"
            type="button"
            class="btn btn-circle btn-sm absolute left-3 top-1/2 z-10 -translate-y-1/2 border-white/30 bg-black/35 text-white hover:bg-black/50"
            @click="prev"
          >
            <Icon name="mdi:chevron-left" size="20" />
          </button>

          <div
            ref="viewportRef"
            class="relative flex h-full w-full touch-none items-center justify-center overflow-hidden"
            @wheel.prevent="onWheel"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @pointerleave="onPointerUp"
          >
            <AppImage
              v-if="currentSlide"
              :src="currentSlide.imageUrl"
              :alt="currentSlideAlt"
              class="max-h-full max-w-full select-none object-contain transition-transform duration-100"
              :style="imageTransformStyle"
              fit="contain"
              draggable="false"
            />
          </div>

          <button
            v-if="slides.length > 1"
            type="button"
            class="btn btn-circle btn-sm absolute right-3 top-1/2 z-10 -translate-y-1/2 border-white/30 bg-black/35 text-white hover:bg-black/50"
            @click="next"
          >
            <Icon name="mdi:chevron-right" size="20" />
          </button>
        </div>

        <div
          v-if="slides.length > 1"
          ref="thumbsRef"
          class="border-t border-white/10 bg-black/20 px-3 py-3 sm:px-4"
        >
          <div class="flex gap-3 overflow-x-auto pb-1">
            <button
              v-for="(slide, slideIndex) in slides"
              :key="`${slide.id}-thumb`"
              type="button"
              class="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border transition sm:h-20 sm:w-20"
              :class="slideIndex === currentSlideIndex ? 'border-white ring-2 ring-white/50' : 'border-white/15 opacity-80 hover:opacity-100'"
              @click="goTo(slideIndex)"
            >
              <AppImage
                :src="slide.imageUrl"
                :alt="pickLocalizedText(locale, slide.alt)"
                class="h-full w-full object-cover"
                sizes="80px"
                draggable="false"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="emit('close')">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import type { PageBuilderSectionBackgroundCarouselSlide } from '#modula/shared/pageBuilder'
import { pickLocalizedText } from '#modula/shared/pageBuilder'

const props = defineProps<{
  open: boolean
  slides: PageBuilderSectionBackgroundCarouselSlide[]
  locale: string
  currentIndex: number
}>()

const emit = defineEmits<{
  close: []
  'update:currentIndex': [value: number]
}>()

const viewportRef = ref<HTMLElement | null>(null)
const thumbsRef = ref<HTMLElement | null>(null)
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const activePointers = new Map<number, { x: number; y: number }>()
const dragStart = ref<{ x: number; y: number; translateX: number; translateY: number } | null>(null)
const pinchStart = ref<{ distance: number; scale: number } | null>(null)
const swipeStart = ref<{ x: number; y: number; at: number } | null>(null)

const currentSlideIndex = computed(() => {
  if (!props.slides.length) return 0
  return Math.max(0, Math.min(props.currentIndex, props.slides.length - 1))
})
const currentSlide = computed(() => props.slides[currentSlideIndex.value] || null)
const currentSlideAlt = computed(() => currentSlide.value ? pickLocalizedText(props.locale, currentSlide.value.alt) || currentSlide.value.imageUrl : '')
const imageTransformStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: 'center center'
}))

watch(() => props.open, (open) => {
  if (!open) resetTransform()
})

watch(() => props.currentIndex, () => {
  resetTransform()
  scrollActiveThumbIntoView()
})

function clampScale(value: number) {
  return Math.max(1, Math.min(4, value))
}

function resetTransform() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  dragStart.value = null
  pinchStart.value = null
  swipeStart.value = null
  activePointers.clear()
}

function zoomIn() {
  scale.value = clampScale(scale.value + 0.25)
}

function zoomOut() {
  scale.value = clampScale(scale.value - 0.25)
  if (scale.value === 1) {
    translateX.value = 0
    translateY.value = 0
  }
}

function prev() {
  if (!props.slides.length) return
  emit('update:currentIndex', (currentSlideIndex.value - 1 + props.slides.length) % props.slides.length)
}

function next() {
  if (!props.slides.length) return
  emit('update:currentIndex', (currentSlideIndex.value + 1) % props.slides.length)
}

function goTo(index: number) {
  if (!props.slides.length) return
  emit('update:currentIndex', Math.max(0, Math.min(index, props.slides.length - 1)))
}

function onWheel(event: WheelEvent) {
  const delta = event.deltaY < 0 ? 0.15 : -0.15
  scale.value = clampScale(scale.value + delta)
  if (scale.value === 1) {
    translateX.value = 0
    translateY.value = 0
  }
}

function getDistance(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return 0
  const [a, b] = points
  if (!a || !b) return 0
  return Math.hypot(b.x - a.x, b.y - a.y)
}

function onPointerDown(event: PointerEvent) {
  if (!viewportRef.value) return
  viewportRef.value.setPointerCapture(event.pointerId)
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (activePointers.size === 1) {
    if (scale.value > 1) {
      dragStart.value = {
        x: event.clientX,
        y: event.clientY,
        translateX: translateX.value,
        translateY: translateY.value
      }
    } else {
      swipeStart.value = {
        x: event.clientX,
        y: event.clientY,
        at: Date.now()
      }
    }
  }

  if (activePointers.size === 2) {
    pinchStart.value = {
      distance: getDistance(Array.from(activePointers.values())),
      scale: scale.value
    }
    dragStart.value = null
    swipeStart.value = null
  }
}

function onPointerMove(event: PointerEvent) {
  if (!activePointers.has(event.pointerId)) return
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

  if (activePointers.size === 2 && pinchStart.value) {
    const distance = getDistance(Array.from(activePointers.values()))
    if (distance > 0 && pinchStart.value.distance > 0) {
      scale.value = clampScale(pinchStart.value.scale * (distance / pinchStart.value.distance))
      if (scale.value === 1) {
        translateX.value = 0
        translateY.value = 0
      }
    }
    return
  }

  if (activePointers.size === 1 && dragStart.value && scale.value > 1) {
    translateX.value = dragStart.value.translateX + (event.clientX - dragStart.value.x)
    translateY.value = dragStart.value.translateY + (event.clientY - dragStart.value.y)
  }
}

function onPointerUp(event: PointerEvent) {
  const start = swipeStart.value
  const endX = event.clientX
  const endY = event.clientY
  activePointers.delete(event.pointerId)

  if (start && scale.value === 1) {
    const deltaX = endX - start.x
    const deltaY = endY - start.y
    const elapsed = Date.now() - start.at
    if (elapsed < 700 && Math.abs(deltaX) > 48 && Math.abs(deltaY) < 32) {
      if (deltaX < 0) {
        next()
      } else {
        prev()
      }
    }
  }

  if (activePointers.size < 2) {
    pinchStart.value = null
  }
  if (!activePointers.size) {
    dragStart.value = null
    swipeStart.value = null
  }
}

function scrollActiveThumbIntoView() {
  if (!import.meta.client || !thumbsRef.value) return
  const activeThumb = thumbsRef.value.querySelectorAll('button')[currentSlideIndex.value] as HTMLElement | undefined
  activeThumb?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    prev()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    next()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
  }
}

onMounted(() => {
  if (import.meta.client) {
    window.addEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) {
    window.removeEventListener('keydown', onKeydown)
  }
})
</script>
