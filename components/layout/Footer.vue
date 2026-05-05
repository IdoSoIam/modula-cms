<template>
  <footer class="footer footer-center p-10 bg-neutral text-neutral-content w-full">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 w-full max-w-7xl">
      <!-- Logo et description -->
      <div class="flex flex-col items-center">
        <img src="/images/logo-removebg-preview.png" alt="Logo" class="h-20 mb-2" />
        <p class="font-bold text-lg">Ferme du Campeyrigoux</p>
        <p class="opacity-80">{{ $t("footer.organic") }}</p>
      </div>

      <!-- Horaires -->
      <div class="flex flex-col items-center">
        <h4 class="footer-title">{{ $t("footer.hours") }}</h4>
        <div class="opacity-80 text-center">
          <p>{{ $t("footer.farmSale") }}</p>
          <p>{{ farmDayLabel }}</p>
          <p>{{ siteConfig?.farmPickup.slotLabel || $t('pages.home.scheduleDetail') }}</p>
        </div>
      </div>

      <!-- Contact -->
      <div class="flex flex-col items-center">
        <h4 class="footer-title">{{ $t("footer.contact") }}</h4>
        <div class="opacity-80 text-center">
          {{ siteConfig?.farmPickup.address }}
          <p class="flex items-center gap-2 justify-center">
            <Icon name="mdi:phone" size="18" />
            {{ siteConfig?.adminPhone || '07 68 55 06 64' }}
          </p>
          <p class="flex items-center gap-2 justify-center">
            <Icon name="mdi:email" size="18" />
            {{ siteConfig?.adminEmail }}
          </p>
        </div>
      </div>

      <!-- Réseaux sociaux -->
      <div class="flex flex-col items-center">
        <h4 class="footer-title">{{ $t("footer.followUs") }}</h4>
        <div class="flex gap-4">
          <a
            href="https://www.facebook.com/profile.php?id=61571709076079"
            target="_blank"
            class="btn btn-circle btn-outline"
            aria-label="Facebook"
          >
            <Icon name="mdi:facebook" size="24" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>


<script setup lang="ts">
interface SiteConfig {
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotLabel: string
  },
  adminEmail: string
  adminPhone: string
}

const { data: siteConfig } = await useFetch<SiteConfig>('/api/site-config')

const farmDayLabel = computed(() => {
  const day = siteConfig.value?.farmPickup.dayOfWeek
  const labelsFR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const labelsEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  if (import.meta.client) {
    const locale = useI18n().locale.value
    return typeof day === 'number' ? (locale === 'fr' ? labelsFR[day] : labelsEN[day]) : ''
  }
  return ''
})
</script>

