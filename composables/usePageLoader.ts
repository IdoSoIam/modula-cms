import { ref, type Ref } from 'vue'

const isLoading: Ref<boolean> = ref(false)
let registered = false
let timer: ReturnType<typeof setTimeout> | null = null
let loadingToken = 0

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function onStartLoading() {
  loadingToken += 1
  const currentToken = loadingToken
  clearTimer()
  timer = setTimeout(() => {
    if (currentToken === loadingToken) {
      isLoading.value = true
    }
  }, 500)
}

function onStopLoading() {
  loadingToken += 1
  clearTimer()
  isLoading.value = false
}

export function usePageLoader() {
  if (!import.meta.client) {
    return { isLoading }
  }

  if (!registered) {
    registered = true
    const nuxtApp = useNuxtApp()
    nuxtApp.hook('page:start', () => {
      onStartLoading()
    })
    nuxtApp.hook('page:finish', () => {
      onStopLoading()
    })
    nuxtApp.hook('page:loading:end', () => {
      onStopLoading()
    })
    nuxtApp.hook('app:error', () => {
      onStopLoading()
    })
  }

  return { isLoading }
}
