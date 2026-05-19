<template>
  <img
    v-if="usesUploadRoute"
    v-bind="attrs"
    :src="uploadSrc"
    :srcset="uploadSrcset"
    :sizes="uploadSizes"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="loading"
    :fetchpriority="fetchpriority"
    :decoding="decoding"
  >
  <img
    v-else-if="usesNativeImage"
    v-bind="attrs"
    :src="normalizedSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :loading="loading"
    :fetchpriority="fetchpriority"
    :decoding="decoding"
  >
  <NuxtImg
    v-else
    v-bind="attrs"
    :provider="resolvedProvider"
    :src="normalizedSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :sizes="sizes"
    :loading="loading"
    :fetchpriority="fetchpriority"
    :decoding="decoding"
    :quality="quality"
    :format="resolvedFormat"
    :densities="resolvedNuxtDensities"
    :preload="preload"
    :modifiers="resolvedModifiers"
  />
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

type ImageFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
type FetchPriority = 'auto' | 'high' | 'low'
type Decoding = 'async' | 'auto' | 'sync'
type ImageProvider = 'ipx' | 'cloudflare'

const props = withDefaults(defineProps<{
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  sizes?: string
  loading?: 'eager' | 'lazy'
  fetchpriority?: FetchPriority
  decoding?: Decoding
  fit?: ImageFit
  quality?: number | string
  format?: string | string[]
  densities?: string | number
  preload?: boolean
  provider?: ImageProvider
  modifiers?: Record<string, any>
}>(), {
  alt: '',
  loading: 'lazy',
  fetchpriority: 'auto',
  decoding: 'async',
  fit: undefined,
  quality: undefined,
  format: undefined,
  densities: undefined,
  preload: false,
  provider: undefined,
  modifiers: undefined
})

const attrs = useAttrs()

const stripUrlSuffix = (value: string) => value.replace(/[?#].*$/, '')

const isSvgSource = (value: string) => /\.svg$/i.test(stripUrlSuffix(value))

const normalizeSrc = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith('/') || trimmed.startsWith('data:') || /^[a-z]+:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `/uploads/${trimmed.replace(/^\.?\//, '')}`
}

const normalizeFit = (value: ImageFit | undefined) => {
  switch (value) {
    case 'cover':
    case 'contain':
      return value
    case 'fill':
      return 'pad'
    case 'inside':
    case 'outside':
      return 'scale-down'
    default:
      return undefined
  }
}

const parseDensityCandidates = (value: string | number | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return [value]
  }

  if (typeof value !== 'string' || !value.trim()) {
    return [1, 2]
  }

  return value
    .split(/[,\s]+/)
    .map((part) => part.trim().replace(/x$/i, ''))
    .map((part) => Number.parseFloat(part))
    .filter((part, index, values) => Number.isFinite(part) && part > 0 && values.indexOf(part) === index)
}

const parseBaseWidth = (value: number | string | undefined, sizes: string | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.round(value)
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  if (typeof sizes === 'string') {
    const matches = [...sizes.matchAll(/(\d+)px/gi)]
    const lastMatch = matches.at(-1)
    if (lastMatch && lastMatch[1]) {
      return Number.parseInt(lastMatch[1], 10)
    }
  }

  return undefined
}

const normalizeQueryParam = (value: number | string | undefined) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return String(Math.round(value))
  }

  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  return undefined
}

const normalizedSrc = computed(() => normalizeSrc(props.src || ''))

const usesUploadRoute = computed(() => normalizedSrc.value.startsWith('/uploads/'))

const usesNativeImage = computed(() =>
  !normalizedSrc.value
  || normalizedSrc.value.startsWith('data:')
  || isSvgSource(normalizedSrc.value)
)

const resolvedProvider = computed(() => props.provider || 'ipx')

const resolvedFormat = computed(() => {
  if (Array.isArray(props.format)) {
    return props.format[0] || undefined
  }

  return props.format
})

const resolvedNuxtDensities = computed(() => {
  if (typeof props.densities === 'number') {
    return String(props.densities)
  }

  return props.densities
})

const resolvedModifiers = computed(() => {
  const modifiers = { ...(props.modifiers || {}) }

  if (props.fit && !modifiers.fit) {
    modifiers.fit = props.fit
  }

  return modifiers
})

const uploadBaseWidth = computed(() => parseBaseWidth(props.width, props.sizes))

const uploadDensityCandidates = computed(() => parseDensityCandidates(props.densities))

const uploadFit = computed(() => normalizeFit(props.fit))

const buildUploadUrl = (density: number) => {
  const query = new URLSearchParams()
  const baseWidth = uploadBaseWidth.value
  const normalizedHeight = normalizeQueryParam(props.height)
  const normalizedQuality = normalizeQueryParam(props.quality)
  const format = resolvedFormat.value

  if (baseWidth) {
    query.set('w', String(Math.max(1, Math.round(baseWidth * density))))
  }

  if (normalizedHeight) {
    query.set('h', normalizedHeight)
  }

  if (normalizedQuality) {
    query.set('q', normalizedQuality)
  }

  if (uploadFit.value) {
    query.set('fit', uploadFit.value)
  }

  if (typeof format === 'string' && format) {
    query.set('format', format)
  }

  const queryString = query.toString()
  return queryString ? `${normalizedSrc.value}?${queryString}` : normalizedSrc.value
}

const uploadSrc = computed(() => buildUploadUrl(1))

const uploadSrcset = computed(() => {
  if (!uploadBaseWidth.value || uploadDensityCandidates.value.length <= 1) {
    return undefined
  }

  return uploadDensityCandidates.value
    .map((density) => `${buildUploadUrl(density)} ${density}x`)
    .join(', ')
})

const uploadSizes = computed(() => (uploadSrcset.value ? props.sizes : undefined))
</script>
