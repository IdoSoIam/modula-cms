<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-primary/10 py-16">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div class="space-y-6">
            <h1 class="text-4xl font-bold">Découvrez notre CBD Bio</h1>
            <p class="text-lg">
              Cultivé avec soin dans notre ferme en agriculture biologique, notre CBD 
              est 100% naturel et respecte les normes les plus strictes de qualité.
            </p>
            <NuxtLink to="/shop" class="btn btn-primary btn-lg">
              Voir nos produits CBD
            </NuxtLink>
          </div>
          <div class="relative">
            <!--<img 
              src="/images/cbd-plant.jpg" 
              alt="Culture de CBD" 
              class="rounded-lg shadow-xl"
            />-->
          </div>
        </div>
      </div>
    </section>

    <!-- Avantages Section -->
    <section class="py-16">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Les bienfaits du CBD</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <Icon name="mdi:leaf" class="text-4xl text-primary mb-4" />
              <h3 class="card-title">100% Naturel</h3>
              <p>Cultivé en agriculture biologique, sans pesticides ni produits chimiques.</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <Icon name="mdi:certificate" class="text-4xl text-primary mb-4" />
              <h3 class="card-title">Qualité Certifiée</h3>
              <p>Analyses régulières et certification bio garantissant la qualité de nos produits.</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <Icon name="mdi:sprout" class="text-4xl text-primary mb-4" />
              <h3 class="card-title">Production Locale</h3>
              <p>Du champ à votre table, nous maîtrisons toute la chaîne de production.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-16 bg-base-200">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
        <div class="max-w-3xl mx-auto space-y-4">
          <div class="collapse collapse-arrow bg-base-100">
            <input type="radio" name="faq" checked="checked" /> 
            <div class="collapse-title text-xl font-medium">
              Qu'est-ce que le CBD ?
            </div>
            <div class="collapse-content">
              <p>Le CBD (Cannabidiol) est un cannabinoïde naturel extrait du chanvre. 
                 Contrairement au THC, il n'a pas d'effets psychoactifs et est totalement légal en France.</p>
            </div>
          </div>

          <div class="collapse collapse-arrow bg-base-100">
            <input type="radio" name="faq" />
            <div class="collapse-title text-xl font-medium">
              Est-ce que vos produits sont légaux ?
            </div>
            <div class="collapse-content">
              <p>Oui, tous nos produits sont 100% légaux en France. Ils contiennent moins de 0,2% de THC, 
                 conformément à la législation en vigueur.</p>
            </div>
          </div>

          <div class="collapse collapse-arrow bg-base-100">
            <input type="radio" name="faq" />
            <div class="collapse-title text-xl font-medium">
              Comment choisir mon produit CBD ?
            </div>
            <div class="collapse-content">
              <p>Le choix dépend de vos préférences et besoins. Nous proposons des huiles pour une action 
                 progressive, des fleurs pour une utilisation en infusion, et des produits dérivés pour 
                 une utilisation plus spécifique.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">Prêt à découvrir nos produits CBD ?</h2>
        <p class="text-lg mb-8">
          Explorez notre gamme de produits CBD bio et locaux
        </p>
        <NuxtLink to="/shop" class="btn btn-primary btn-lg">
          Voir la boutique
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
