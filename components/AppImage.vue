<template>
  <img
    v-if="usesNativeImage"
    v-bind="attrs"
    :src="normalizedSrc"
    :alt="alt"
    :loading="loading"
    :fetchpriority="fetchpriority"
    :decoding="decoding"
  >
  <NuxtImg
    v-else
    v-bind="attrs"
    :provider="resolvedProvider"
    :src="renderSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :sizes="sizes"
    :loading="loading"
    :fetchpriority="fetchpriority"
    :decoding="decoding"
    :quality="quality"
    :format="resolvedFormat"
    :densities="resolvedDensities"
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
const runtimeConfig = useRuntimeConfig()
const requestURL = useRequestURL()

const stripUrlSuffix = (value: string) => value.replace(/[?#].*$/, '')

const isSvgSource = (value: string) => /\.svg$/i.test(stripUrlSuffix(value))

const isLocalHostname = (value: string) => ['localhost', '127.0.0.1', '::1'].includes(value)

const normalizeSrc = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith('/') || trimmed.startsWith('data:') || /^[a-z]+:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `/uploads/${trimmed.replace(/^\.?\//, '')}`
}

const normalizedSrc = computed(() => normalizeSrc(props.src || ''))

const isCloudflareEligible = (value: string, baseURL: string) => {
  if (!value || value.startsWith('data:') || isSvgSource(value)) {
    return false
  }

  if (value.startsWith('/')) {
    return true
  }

  if (!/^https?:\/\//i.test(value) || !baseURL) {
    return false
  }

  try {
    return new URL(value).origin === new URL(baseURL).origin
  } catch {
    return false
  }
}

const usesNativeImage = computed(() =>
  !normalizedSrc.value
  || normalizedSrc.value.startsWith('data:')
  || isSvgSource(normalizedSrc.value)
  || (
    resolvedProvider.value === 'ipx'
    && runtimeConfig.public.imageStorageDriver === 'r2'
    && normalizedSrc.value.startsWith('/uploads/')
  )
)

const resolvedProvider = computed(() => {
  if (props.provider) {
    return props.provider
  }

  const mode = runtimeConfig.public.imageDeliveryMode || 'ipx'
  const baseURL = runtimeConfig.public.imageCloudflareBaseURL || ''
  const currentHostname = import.meta.client ? window.location.hostname : requestURL.hostname

  if (
    mode === 'cloudflare'
    && !isLocalHostname(currentHostname)
    && !import.meta.dev
    && isCloudflareEligible(normalizedSrc.value, baseURL)
  ) {
    return 'cloudflare'
  }

  return 'ipx' as const
})

const renderSrc = computed(() => normalizedSrc.value)

const resolvedFormat = computed(() => {
  if (Array.isArray(props.format)) {
    return props.format[0]
  }

  return props.format
})

const resolvedDensities = computed(() => {
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
</script>
