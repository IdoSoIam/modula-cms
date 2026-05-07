<template>
  <button 
    class="btn btn-ghost btn-circle"
    @click="toggleLightDark"
    :title="theme === 'ferme-dark' ? 'Passer en mode clair' : 'Passer en mode sombre'"
  >
    <Icon 
      :name="theme === 'ferme-dark' ? 'mdi:white-balance-sunny' : 'mdi:moon-waning-crescent'" 
      size="24"
      class="swap-rotate"
    />
  </button>
</template>

<script setup lang="ts">
const { theme, toggleLightDark } = useTheme()
</script>
