<template>
  <div class="min-h-screen bg-base-100">
    <section
      class="hero min-h-[78vh] items-end overflow-hidden"
      style="background-image: linear-gradient(120deg, rgba(19,33,17,.68), rgba(19,33,17,.34)), url('/images/plaquette.jpg'); background-position:center; background-size:cover;"
    >
      <div class="hero-content w-full max-w-6xl justify-start px-4 py-20 text-neutral-content">
        <div class="max-w-3xl">
          <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
            <Icon name="mdi:leaf" size="18" />
            {{ $t('pages.home.heroTag') }}
          </div>

          <h1 class="mb-5 text-5xl font-bold leading-tight md:text-6xl">
            {{ $t('pages.home.title') }}
          </h1>
          <p class="mb-6 max-w-2xl text-lg text-white/90 md:text-xl">
            {{ $t('pages.home.subtitle') }}
          </p>

          <div class="flex flex-wrap gap-3">
            <NuxtLink to="/paniers" class="btn btn-primary btn-lg">{{ $t('pages.home.basketsCta') }}</NuxtLink>
            <NuxtLink to="/contact" class="btn btn-outline btn-lg text-white hover:text-base-content">{{ $t('pages.home.meetUs') }}</NuxtLink>
          </div>

          <div class="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
            <div class="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div class="text-xs uppercase tracking-[0.18em] text-white/70">{{ $t('pages.home.highlight1Title') }}</div>
              <div class="mt-2 text-sm">{{ $t('pages.home.highlight1Text') }}</div>
            </div>
            <div class="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div class="text-xs uppercase tracking-[0.18em] text-white/70">{{ $t('pages.home.highlight2Title') }}</div>
              <div class="mt-2 text-sm">{{ $t('pages.home.highlight2Text') }}</div>
            </div>
            <div class="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <div class="text-xs uppercase tracking-[0.18em] text-white/70">{{ $t('pages.home.highlight3Title') }}</div>
              <div class="mt-2 text-sm">{{ $t('pages.home.highlight3Text') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-y border-base-300 bg-base-200/70 py-5">
      <div class="container mx-auto grid gap-4 px-4 md:grid-cols-3">
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-primary/10 p-3 text-primary">
            <Icon name="mdi:calendar-week" size="22" />
          </div>
          <div>
            <div class="font-semibold">{{ $t('pages.home.schedule') }}</div>
            <div class="text-sm opacity-70">
              {{ farmDayLabel }} - {{ siteConfig?.farmPickup.slotLabel || $t('pages.home.scheduleDetail') }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-primary/10 p-3 text-primary">
            <Icon name="mdi:map-marker-outline" size="22" />
          </div>
          <div>
            <div class="font-semibold">{{ $t('pages.home.locationTitle') }}</div>
            <div class="text-sm opacity-70">{{ siteConfig?.farmPickup.address || $t('pages.home.location') }}</div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div class="rounded-xl bg-primary/10 p-3 text-primary">
            <Icon name="mdi:food-apple-outline" size="22" />
          </div>
          <div>
            <div class="font-semibold">{{ $t('pages.home.qualityTitle') }}</div>
            <div class="text-sm opacity-70">{{ $t('pages.home.qualityText') }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="mb-10 max-w-2xl">
          <h2 class="text-3xl font-bold">{{ $t('pages.home.ourActivities') }}</h2>
          <p class="mt-3 opacity-75">{{ $t('pages.home.activitiesIntro') }}</p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="mb-3 w-fit rounded-xl bg-primary/10 p-3 text-primary">
                <Icon name="mdi:sprout" size="24" />
              </div>
              <h3 class="card-title">{{ $t('pages.home.organicGardening') }}</h3>
              <p>{{ $t('pages.home.organicGardeningDesc') }}</p>
            </div>
          </div>

          <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="mb-3 w-fit rounded-xl bg-secondary/10 p-3 text-secondary">
                <Icon name="mdi:basket-outline" size="24" />
              </div>
              <h3 class="card-title">{{ $t('pages.home.basketsTitle') }}</h3>
              <p>{{ $t('pages.home.basketsDesc') }}</p>
              <div class="card-actions mt-3 justify-end">
                <NuxtLink to="/paniers" class="btn btn-primary">{{ $t('pages.home.basketsCta') }}</NuxtLink>
              </div>
            </div>
          </div>

          <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="mb-3 w-fit rounded-xl bg-accent/10 p-3 text-accent">
                <Icon name="mdi:egg-outline" size="24" />
              </div>
              <h3 class="card-title">{{ $t('pages.home.eggsPoultry') }}</h3>
              <p>{{ $t('pages.home.eggsPoultryDesc') }}</p>
            </div>
          </div>

          <div class="card border border-base-300 bg-base-100 shadow-sm">
            <div class="card-body">
              <div class="mb-3 w-fit rounded-xl bg-success/10 p-3 text-success">
                <Icon name="mdi:leaf-circle-outline" size="24" />
              </div>
              <h3 class="card-title">{{ $t('pages.home.diversificationTitle') }}</h3>
              <p>{{ $t('pages.home.diversificationDesc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-base-100 py-4">
      <div class="container mx-auto px-4">
        <div class="rounded-[2rem] border border-base-300 bg-base-200/60 p-8">
          <div class="mb-6 max-w-2xl">
            <h2 class="text-3xl font-bold">Des paniers simples à réserver</h2>
            <p class="mt-3 opacity-75">
              L'objectif est de rendre la commande facile à comprendre : vous choisissez votre panier, puis votre mode de retrait ou livraison. Le retrait à la ferme concerne les paniers réservés sur le site.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="rounded-2xl bg-base-100 p-5 shadow-sm">
              <div class="mb-3 w-fit rounded-xl bg-primary/10 p-3 text-primary">
                <Icon name="mdi:home-outline" size="22" />
              </div>
              <div class="font-semibold">Retrait à la ferme</div>
              <p class="mt-2 text-sm opacity-75">
                Une solution simple pour venir récupérer votre panier réservé directement à la ferme, sur confirmation par email.
              </p>
            </div>

            <div class="rounded-2xl bg-base-100 p-5 shadow-sm">
              <div class="mb-3 w-fit rounded-xl bg-primary/10 p-3 text-primary">
                <Icon name="mdi:store-marker-outline" size="22" />
              </div>
              <div class="font-semibold">Point relais</div>
              <p class="mt-2 text-sm opacity-75">
                Selon les disponibilités, vous pouvez choisir un point de retrait pratique.
              </p>
            </div>

            <div class="rounded-2xl bg-base-100 p-5 shadow-sm">
              <div class="mb-3 w-fit rounded-xl bg-primary/10 p-3 text-primary">
                <Icon name="mdi:truck-fast-outline" size="22" />
              </div>
              <div class="font-semibold">Livraison tournée</div>
              <p class="mt-2 text-sm opacity-75">
                Pour certaines villes, une tournée de livraison peut être proposée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-base-200 py-16">
      <div class="container mx-auto px-4">
        <div class="grid items-center gap-8 lg:grid-cols-[1.15fr_.85fr]">
          <div class="space-y-5">
            <div class="badge badge-primary badge-outline">{{ $t('pages.home.directSaleBadge') }}</div>
            <h2 class="text-3xl font-bold">{{ $t('pages.home.directSale') }}</h2>
            <p class="text-lg opacity-85">{{ $t('pages.home.directSaleIntro') }}</p>
            <div class="rounded-2xl border border-base-300 bg-base-100 p-5 text-sm opacity-85">
              La vente à la ferme n'est pas la même chose que le retrait à la ferme des paniers. Ici, il s'agit d'un temps de vente directe pour les légumes récoltés ou récoltables et les autres produits disponibles à la ferme.
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl bg-base-100 p-5 shadow-sm">
                <div class="mb-2 font-semibold">{{ $t('pages.home.scheduleBlockTitle') }}</div>
                <p class="text-sm opacity-75">{{ farmDayLabel }}</p>
                <p class="mt-1 text-sm opacity-75">{{ siteConfig?.farmPickup.slotLabel || $t('pages.home.scheduleDetail') }}</p>
              </div>
              <div class="rounded-2xl bg-base-100 p-5 shadow-sm">
                <div class="mb-2 font-semibold">{{ $t('pages.home.pricingBlockTitle') }}</div>
                <p class="text-sm opacity-75">{{ $t('pages.home.solidarityPricing') }}</p>
              </div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-100 p-5">
              <h3 class="mb-2 font-semibold">{{ $t('pages.home.howItWorksTitle') }}</h3>
              <div class="grid gap-3 md:grid-cols-3">
                <div>
                  <div class="text-sm font-semibold">Je viens ou je réserve</div>
                  <p class="mt-1 text-sm opacity-75">
                    Je peux venir à la vente à la ferme pour les produits disponibles, ou réserver un panier depuis le site.
                  </p>
                </div>
                <div>
                  <div class="text-sm font-semibold">Je reçois la confirmation</div>
                  <p class="mt-1 text-sm opacity-75">
                    Pour les paniers, la ferme confirme par email le lieu et le créneau exacts.
                  </p>
                </div>
                <div>
                  <div class="text-sm font-semibold">Je règle sur place</div>
                  <p class="mt-1 text-sm opacity-75">
                    Le paiement se fait en espèces au retrait ou à la remise des produits.
                  </p>
                </div>
              </div>
            </div>

            <div class="pt-2">
              <NuxtLink to="/contact" class="btn btn-primary">{{ $t('pages.home.findUs') }}</NuxtLink>
            </div>
          </div>

          <div class="space-y-4">
            <img src="/images/vente_direct_saint_seb.jpg" alt="Vente directe" class="w-full rounded-[2rem] shadow-xl" />
            <div class="rounded-2xl bg-base-100 p-5 shadow-sm">
              <div class="mb-2 flex items-center gap-2 font-semibold">
                <Icon name="mdi:map-marker-radius-outline" size="20" class="text-primary" />
                {{ $t('pages.home.whereToFindUsTitle') }}
              </div>
              <p class="text-sm opacity-75">{{ siteConfig?.farmPickup.address || $t('pages.home.whereToFindUsText') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="container mx-auto px-4">
        <div class="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
          <div class="rounded-[2rem] border border-base-300 bg-base-100 p-8 shadow-sm">
            <div class="badge badge-outline mb-4">{{ $t('pages.home.trustBadge') }}</div>
            <h2 class="text-3xl font-bold">{{ $t('pages.home.trustTitle') }}</h2>
            <p class="mt-4 opacity-80">{{ $t('pages.home.trustIntro') }}</p>
            <div class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl bg-base-200 p-4">
                <div class="font-semibold">{{ $t('pages.home.trustCard1Title') }}</div>
                <p class="mt-1 text-sm opacity-75">{{ $t('pages.home.trustCard1Text') }}</p>
              </div>
              <div class="rounded-2xl bg-base-200 p-4">
                <div class="font-semibold">{{ $t('pages.home.trustCard2Title') }}</div>
                <p class="mt-1 text-sm opacity-75">{{ $t('pages.home.trustCard2Text') }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-[2rem] bg-primary p-8 text-primary-content shadow-xl">
            <h2 class="text-3xl font-bold">{{ $t('pages.home.ctaTitle') }}</h2>
            <p class="mt-4 max-w-xl text-primary-content/85">{{ $t('pages.home.ctaText') }}</p>
            <div class="mt-6 flex flex-wrap gap-3">
              <NuxtLink to="/paniers" class="btn bg-white text-primary hover:bg-white/90 border-white">
                {{ $t('pages.home.ctaPrimary') }}
              </NuxtLink>
              <NuxtLink to="/contact" class="btn btn-outline border-white text-white hover:bg-white hover:text-primary">
                {{ $t('pages.home.ctaSecondary') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
interface SiteConfig {
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotLabel: string
  }
}

const { data: siteConfig } = await useFetch<SiteConfig>('/api/site-config')

const farmDayLabel = computed(() => {
  const day = siteConfig.value?.farmPickup.dayOfWeek
  const labels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  return typeof day === 'number' ? labels[day] : ''
})
</script>
