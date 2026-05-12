<template>
  <div v-if="themeControllerEnabled && availableThemes.length" class="dropdown dropdown-end">
    <div tabindex="0" role="button" class="btn btn-ghost btn-circle" :title="$t('theme.select')">
      <Icon name="mdi:palette" size="24" />
    </div>
    <ClientOnly>
      <ul
        tabindex="0"
        class="dropdown-content menu bg-base-200 rounded-box z-50 w-56 p-2 shadow-2xl"
      >
        <li class="menu-title">{{ $t('theme.title') }}</li>
        <li v-for="t in availableThemes" :key="t.name">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="theme-dropdown"
              class="theme-controller hidden"
              :value="t.name"
              :checked="theme === t.name"
              @change="setTheme(t.name)"
            />
            <span
              class="w-4 h-4 rounded-full border border-base-content/20 shrink-0"
              :style="`background:${t.preview}`"
            />
            <span class="flex-1">{{ t.displayName }}</span>
            <Icon
              v-if="theme === t.name"
              name="mdi:check"
              size="16"
              class="text-primary"
            />
          </label>
        </li>
      </ul>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
const { theme, availableThemes, setTheme, themeControllerEnabled } = useTheme()
</script>
