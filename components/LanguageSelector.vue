<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-sm gap-2">
      <Icon name="mdi:translate" size="20" />
      {{ currentLocale?.name ?? locale.toUpperCase() }}
      <Icon name="mdi:chevron-down" size="20" />
    </label>
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52">
      <li v-for="availableLocale in availableLocales" :key="availableLocale.code">
        <button type="button" class="text-left text-base-content" @click="changeLocale(availableLocale.code)">
          {{ availableLocale.name }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
type SupportedLocale = 'fr' | 'en'
type LocaleOption = { code: SupportedLocale; name: string }

const { locale, locales, setLocale } = useI18n()

const changeLocale = async (nextLocale: SupportedLocale) => {
  if (nextLocale === locale.value) return
  await setLocale(nextLocale)
}

const availableLocales = computed<LocaleOption[]>(() => {
  return locales.value
    .map((item) => ({
      code: item.code as SupportedLocale,
      name: item.name || item.code
    }))
    .filter(item => item.code !== locale.value)
})

const currentLocale = computed<LocaleOption | undefined>(() => {
  return locales.value
    .map((item) => ({
      code: item.code as SupportedLocale,
      name: item.name || item.code
    }))
    .find(item => item.code === locale.value)
})
</script>
