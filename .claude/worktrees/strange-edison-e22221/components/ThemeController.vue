<template>
  <div class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1">
      <Icon name="mdi:palette-outline" size="20" />
      <span class="hidden sm:inline">{{ currentLabel }}</span>
      <svg
        width="12"
        height="12"
        class="inline-block h-2 w-2 fill-current opacity-60"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2048 2048"
      >
        <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z" />
      </svg>
    </div>
    <ul
      tabindex="0"
      class="dropdown-content menu bg-base-300 rounded-box z-50 w-52 p-2 shadow-2xl"
    >
      <li v-for="t in themes" :key="t.value">
        <input
          type="radio"
          name="theme-dropdown"
          class="theme-controller w-full btn btn-sm btn-block btn-ghost justify-start"
          :aria-label="t.label"
          :value="t.value"
          :checked="theme === t.value"
          @change="applyTheme(t.value)"
        />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const { theme, themes, applyTheme } = useTheme()

const currentLabel = computed(
  () => themes.find(t => t.value === theme.value)?.label ?? 'Thème'
)
</script>
