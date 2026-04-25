<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-sm gap-2">
      <Icon name="mdi:translate" size="20" />
      {{ currentLocale.name }}
      <Icon name="mdi:chevron-down" size="20" />
    </label>
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52">
      <li v-for="locale in availableLocales" :key="locale.code">
        <NuxtLink :to="switchLocalePath(locale.code)" class="text-base-content">
          {{ locale.name }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
    const { locale, locales } = useI18n()
    const switchLocalePath = useSwitchLocalePath()

    const availableLocales = computed(() => {
    return locales.value.filter(i => i.code !== locale.value)
    })

    const currentLocale = computed(() => {
    return locales.value.find(i => i.code === locale.value)
    })
</script>