<template>
  <button 
    class="btn btn-ghost btn-circle"
    @click="toggleTheme"
    :title="theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'"
  >
    <Icon 
      :name="theme === 'dark' ? 'mdi:white-balance-sunny' : 'mdi:moon-waning-crescent'" 
      size="24"
      class="swap-rotate"
    />
  </button>
</template>

<script setup lang="ts">
    const { theme, toggleTheme } = useTheme()
</script>