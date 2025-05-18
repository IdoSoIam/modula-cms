<template>
  <div>
    <!-- Hero Section -->
    <section class="hero min-h-[80vh] bg-gradient-to-br from-primary to-secondary">
      <div class="hero-overlay bg-black/40"></div>
      <div class="hero-content text-white">
        <div class="max-w-2xl">
          <h1 class="text-5xl font-bold mb-4">La Ferme du Campeyrigoux</h1>
          <p class="text-xl mb-8">
            Sur la commune de Saint Sébastien d'Aigrefeuille, la Ferme du Campeyrigoux est une
            exploitation agricole en Bio, gérée par Adèle Godefroid. On y fait du maraichage
            diversifié, des Endives, du poulet de chair, des œufs et du CBD.
          </p>
          <NuxtLink to="/boutique" class="btn btn-primary">
            Découvrir nos produits
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Produits Bio Section -->
    <section class="py-16 bg-base-100">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Nos produits bio en vente directe</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="card bg-base-100 shadow-xl">
            <figure class="px-4 pt-4">
              <ImagePlaceholder alt="Légumes bio" class="rounded-xl h-48 w-full" />
            </figure>
            <div class="card-body">
              <h3 class="card-title">Légumes de saison</h3>
              <p>Des légumes frais et bio, cultivés avec amour dans notre ferme.</p>
            </div>
          </div>

          <div class="card bg-base-100 shadow-xl">
            <figure class="px-4 pt-4">
              <ImagePlaceholder alt="Poulets" class="rounded-xl h-48 w-full" />
            </figure>
            <div class="card-body">
              <h3 class="card-title">Poulets de chair</h3>
              <p>Élevés en plein air et nourris avec des aliments bio.</p>
            </div>
          </div>

          <div class="card bg-base-100 shadow-xl">
            <figure class="px-4 pt-4">
              <ImagePlaceholder alt="Œufs" class="rounded-xl h-48 w-full" />
            </figure>
            <div class="card-body">
              <h3 class="card-title">Œufs frais</h3>
              <p>Des œufs bio de poules élevées en plein air.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CBD Section -->
    <section class="py-16 bg-secondary/10">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Notre gamme CBD</h2>
        <div class="flex flex-col md:flex-row items-center gap-8">
          <div class="flex-1">
            <ImagePlaceholder alt="Produits CBD" class="rounded-lg shadow-xl w-full h-96" />
          </div>
          <div class="flex-1 space-y-4">
            <h3 class="text-2xl font-semibold">CBD 100% Bio et Local</h3>
            <p class="text-lg">
              Découvrez notre gamme de produits CBD cultivés et transformés avec soin
              dans notre ferme, dans le respect des normes biologiques.
            </p>
            <NuxtLink to="/boutique" class="btn btn-primary">
              Voir la boutique en ligne
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Actualités Section -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Nos actualités</h2>
        <div class="card bg-base-100 shadow-xl max-w-2xl mx-auto">
          <div class="card-body text-center">
            <Icon name="mdi:facebook" size="48" class="mx-auto text-primary" />
            <p class="text-lg">
              Suivez nos actualités sur notre page Facebook
            </p>
            <div class="card-actions justify-center">
              <a href="#" class="btn btn-primary">
                Visiter notre page Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
