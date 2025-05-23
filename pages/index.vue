<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <div class="hero min-h-[70vh] relative" style="background-image: url('/images/plaquette.jpg');">
      <div class="hero-overlay bg-opacity-60"></div>
      <div class="hero-content text-center text-neutral-content">
        <div class="max-w-md">
          <h1 class="mb-5 text-5xl font-bold">Ferme du Campeyrigoux</h1>
          <p class="mb-5">Micro-ferme agroécologique en agriculture biologique</p>
          <NuxtLink to="/contact" class="btn btn-primary">Nous rencontrer</NuxtLink>
        </div>
      </div>
    </div>

    <!-- Présentation des activités -->
    <div class="py-12 bg-base-100">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-8">Nos Activités</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Maraîchage -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="card-title">Maraîchage Bio</h3>
              <p>Production de légumes frais et de saison en agriculture biologique.</p>
            </div>
          </div>

          <!-- CBD -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="card-title">Culture de CBD</h3>
              <p>Production de CBD biologique de haute qualité.</p>
              <div class="card-actions justify-end">
                <NuxtLink to="/shop" class="btn btn-primary">Boutique CBD</NuxtLink>
              </div>
            </div>
          </div>

          <!-- Élevage -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="card-title">Œufs & Volailles</h3>
              <p>Élevage de poules en plein air et production d'œufs bio.</p>
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
          </div>
          <div class="w-full md:w-1/2 space-y-4">
            <h2 class="text-3xl font-bold">Vente Directe</h2>
            <p class="text-lg">Tous les samedis de 9h30 à 12h</p>
            <p>Sur la terrasse du SAINT SEB</p>
            <p>Un système de tarification solidaire permet à tous d'avoir accès à une alimentation de qualité, bio et locale.</p>
            <div class="pt-4">
              <NuxtLink to="/contact" class="btn btn-primary">Nous trouver</NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
