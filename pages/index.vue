<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="hero min-h-[70vh] relative" style="background-image: url('/images/plaquette.jpg');">
      <div class="hero-overlay bg-opacity-60"></div>
      <div class="hero-content text-center text-neutral-content">        <div class="max-w-md">
          <h1 class="mb-5 text-5xl font-bold">{{ $t('pages.home.title') }}</h1>
          <p class="mb-5">{{ $t('pages.home.subtitle') }}</p>
          <NuxtLink to="/contact" class="btn btn-primary">{{ $t('pages.home.meetUs') }}</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Présentation des activités -->
    <div class="py-12 bg-base-100">      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-8">{{ $t('pages.home.ourActivities') }}</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Maraîchage -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="card-title">{{ $t('pages.home.organicGardening') }}</h3>
              <p>{{ $t('pages.home.organicGardeningDesc') }}</p>
            </div>
          </div>

          <!-- CBD -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="card-title">{{ $t('pages.home.cbdCulture') }}</h3>
              <p>{{ $t('pages.home.cbdCultureDesc') }}</p>
              <div class="card-actions justify-end">
                <NuxtLink to="/shop" class="btn btn-primary">{{ $t('pages.home.cbdShop') }}</NuxtLink>
              </div>
            </div>
          </div>

          <!-- Élevage -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="card-title">{{ $t('pages.home.eggsPoultry') }}</h3>
              <p>{{ $t('pages.home.eggsPoultryDesc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Vente Directe -->
    <div class="py-12 bg-base-200">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row items-center gap-8">
          <div class="w-full md:w-1/2">
            <img src="/images/vente_direct_saint_seb.jpg" alt="Vente directe" class="rounded-lg shadow-xl" />
          </div>          <div class="w-full md:w-1/2 space-y-4">
            <h2 class="text-3xl font-bold">{{ $t('pages.home.directSale') }}</h2>
            <p class="text-lg">{{ $t('pages.home.schedule') }}</p>
            <p>{{ $t('pages.home.location') }}</p>
            <p>{{ $t('pages.home.solidarityPricing') }}</p>
            <div class="pt-4">
              <NuxtLink to="/contact" class="btn btn-primary">{{ $t('pages.home.findUs') }}</NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
