import { ref, type Ref } from 'vue'

const isLoading: Ref<boolean> = ref(false)
let registered = false
let timer: ReturnType<typeof setTimeout> | null = null
let navigationCount = 0

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

function onStartLoading() {
  navigationCount++
  const currentCount = navigationCount
  clearTimer()
  timer = setTimeout(() => {
    if (currentCount === navigationCount) {
      isLoading.value = true
    }
  }, 500)
}

function onStopLoading() {
  navigationCount++
  clearTimer()
  isLoading.value = false
}

export function usePageLoader() {
  if (!import.meta.client) {
    return { isLoading }
  }

  if (!registered) {
    registered = true
    const router = useRouter()
    router.beforeEach((to, from) => {
      if (to.path !== from.path) {
        onStartLoading()
      }
    })
    router.afterEach(() => {
      onStopLoading()
    })
    router.onError(() => {
      onStopLoading()
    })
  }

  return { isLoading }
}
