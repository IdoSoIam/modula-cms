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
          <p>{{ $t("footer.saturday") }}</p>
          <p>{{ $t("footer.time") }}</p>
        </div>
      </div>

      <!-- Contact -->
      <div class="flex flex-col items-center">
        <h4 class="footer-title">{{ $t("footer.contact") }}</h4>
        <div class="opacity-80 text-center">
          <p>Campeyrigoux</p>
          <p>30140 Saint Sébastien d'Aigrefeuille</p>
          <p class="flex items-center gap-2 justify-center">
            <Icon name="mdi:phone" size="18" />
            07 68 55 06 64
          </p>
          <p class="flex items-center gap-2 justify-center">
            <Icon name="mdi:email" size="18" />
            adele.godefroid@gmail.com
          </p>
        </div>
      </div>

      <!-- Réseaux sociaux -->
      <div class="flex flex-col items-center">
        <h4 class="footer-title">{{ $t("footer.followUs") }}</h4>
        <div class="flex gap-4">
          <a
            href="https://facebook.com/Ferme-du-Campeyrigoux"
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
