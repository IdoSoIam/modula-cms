<template>  
  <div :data-theme="theme" class="min-h-screen bg-base-100">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    
    <div class="drawer-content flex flex-col">
      <!-- Navbar -->
      <div class="navbar bg-base-100 shadow-lg sticky top-0 z-50">
        <div class="navbar-start">
          <!-- Hamburger pour mobile -->
          <div class="md:hidden">
            <label for="drawer-toggle" class="btn btn-ghost btn-circle">
              <Icon name="mdi:menu" size="24" />
            </label>
          </div>
            <!-- Logo et nom -->
          <NuxtLink :to="localePath('/')" class="flex items-center gap-2">
            <img src="/images/logo-removebg-preview.png" alt="Logo" class="h-12" />
            <span class="text-xl font-bold hidden sm:inline">Ferme du Campeyrigoux</span>
          </NuxtLink>
        </div>
          <!-- Menu desktop -->
        <div class="navbar-center hidden md:flex">
          <ul class="menu menu-horizontal px-1">
            <li>
              <NuxtLink :to="localePath('/')" class="btn btn-ghost" :class="{ 'btn-active': $route.path === localePath('/') }">
                {{ $t('menu.home') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/news')" class="btn btn-ghost" :class="{ 'btn-active': $route.path === localePath('/news') }">
                {{ $t('menu.news') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/shop')" class="btn btn-ghost" :class="{ 'btn-active': $route.path === localePath('/shop') }">
                {{ $t('menu.shop') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/contact')" class="btn btn-ghost" :class="{ 'btn-active': $route.path === localePath('/contact') }">
                {{ $t('menu.contact') }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div class="navbar-end">
          <ThemeToggle />
          <LanguageSelector />
          <MiniCart />
        </div>
      </div>

      <!-- Contenu principal -->
      <main class="flex-grow">
        <slot />
      </main>      

      
        <!-- Footer -->
      <footer class="footer footer-center p-10 bg-neutral text-neutral-content w-full">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 w-full max-w-7xl">
          <div class="flex flex-col items-center">
            <img src="/images/logo-removebg-preview.png" alt="Logo" class="h-20 mb-2" />
            <p class="font-bold text-lg">Ferme du Campeyrigoux</p>
            <p class="opacity-80">{{ $t('footer.organic') }}</p>
          </div>
          
          <div class="flex flex-col items-center">
            <h4 class="footer-title">Horaires d'ouverture</h4>
            <div class="opacity-80 text-center">
              <p>Vente directe à la ferme</p>
              <p>Tous les samedis</p>
              <p>de 9h30 à 12h</p>
            </div>
          </div>
          
          <div class="flex flex-col items-center">
            <h4 class="footer-title">Nous contacter</h4>
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
          
          <div class="flex flex-col items-center">
            <h4 class="footer-title">Suivez-nous</h4>
            <div class="flex gap-4">
              <a href="https://facebook.com/Ferme-du-Campeyrigoux" 
                 target="_blank" 
                 class="btn btn-circle btn-outline">
                <Icon name="mdi:facebook" size="24" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>    <!-- Sidebar mobile -->
    <div class="drawer-side z-50">
      <label for="drawer-toggle" class="drawer-overlay"></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-100">
        <li class="mb-4">
          <img src="/images/logo-removebg-preview.png" alt="Logo" class="h-24 mx-auto" />
        </li>
        <li>
          <NuxtLink :to="localePath('/')" :class="{ 'active': $route.path === localePath('/') }">
            {{ $t('menu.home') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath('/news')" :class="{ 'active': $route.path === localePath('/news') }">
            {{ $t('menu.news') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath('/shop')" :class="{ 'active': $route.path === localePath('/shop') }">
            {{ $t('menu.shop') }}
          </NuxtLink>
        </li>
        <li>
          <NuxtLink :to="localePath('/contact')" :class="{ 'active': $route.path === localePath('/contact') }">
            {{ $t('menu.contact') }}
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>


<script setup lang="ts">
  const { locale } = useI18n()
  const switchLocalePath = useSwitchLocalePath()
  const localePath = useLocalePath()
  const { theme } = useTheme()

  useHead({
    htmlAttrs: {
      lang: locale
    },
    link: [
      {
        rel: 'alternate',
        hreflang: 'fr',
        href: switchLocalePath('fr')
      },
      {
        rel: 'alternate',
        hreflang: 'en',
        href: switchLocalePath('en')
      }
    ]
  })
</script>