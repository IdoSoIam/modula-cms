<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-primary/10 py-16">
      <div class="container mx-auto px-4">        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div class="space-y-6">
            <h1 class="text-4xl font-bold">{{ $t('pages.cbd.title') }}</h1>
            <p class="text-lg">
              {{ $t('pages.cbd.subtitle') }}
            </p>
            <NuxtLink to="/shop" class="btn btn-primary btn-lg">
              {{ $t('pages.cbd.viewProducts') }}
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
    <section class="py-16">      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">{{ $t('pages.cbd.benefits') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <Icon name="mdi:leaf" class="text-4xl text-primary mb-4" />
              <h3 class="card-title">{{ $t('pages.cbd.natural') }}</h3>
              <p>{{ $t('pages.cbd.naturalDesc') }}</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <Icon name="mdi:certificate" class="text-4xl text-primary mb-4" />
              <h3 class="card-title">{{ $t('pages.cbd.certifiedQuality') }}</h3>
              <p>{{ $t('pages.cbd.certifiedQualityDesc') }}</p>
            </div>
          </div>
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <Icon name="mdi:sprout" class="text-4xl text-primary mb-4" />
              <h3 class="card-title">{{ $t('pages.cbd.localProduction') }}</h3>
              <p>{{ $t('pages.cbd.localProductionDesc') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-16 bg-base-200">      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold text-center mb-12">{{ $t('pages.cbd.faq') }}</h2>
        <div class="max-w-3xl mx-auto space-y-4">
          <div class="collapse collapse-arrow bg-base-100">
            <input type="radio" name="faq" checked="true" /> 
            <div class="collapse-title text-xl font-medium">
              {{ $t('pages.cbd.whatIsCbd') }}
            </div>
            <div class="collapse-content">
              <p>{{ $t('pages.cbd.whatIsCbdAnswer') }}</p>
            </div>
          </div>

          <div class="collapse collapse-arrow bg-base-100">
            <input type="radio" name="faq" />
            <div class="collapse-title text-xl font-medium">
              {{ $t('pages.cbd.legalQuestion') }}
            </div>
            <div class="collapse-content">
              <p>{{ $t('pages.cbd.legalAnswer') }}</p>
            </div>
          </div>

          <div class="collapse collapse-arrow bg-base-100">
            <input type="radio" name="faq" />
            <div class="collapse-title text-xl font-medium">
              {{ $t('pages.cbd.howToChoose') }}
            </div>
            <div class="collapse-content">
              <p>{{ $t('pages.cbd.howToChooseAnswer') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->    <section class="py-16">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl font-bold mb-6">{{ $t('pages.cbd.ctaTitle') }}</h2>
        <p class="text-lg mb-8">
          {{ $t('pages.cbd.ctaSubtitle') }}
        </p>
        <NuxtLink to="/shop" class="btn btn-primary btn-lg">
          {{ $t('pages.cbd.ctaButton') }}
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
