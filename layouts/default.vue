<template>
  <div class="drawer" data-theme="light">
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
          <NuxtLink to="/" class="btn btn-ghost text-xl">Ferme du Campeyrigoux</NuxtLink>
        </div>
        
        <!-- Menu desktop -->
        <div class="navbar-center hidden md:flex">
          <ul class="menu menu-horizontal px-1">
            <li><NuxtLink to="/" class="btn btn-ghost">Accueil</NuxtLink></li>
            <li><NuxtLink to="/boutique" class="btn btn-ghost">Boutique CBD</NuxtLink></li>
            <li><NuxtLink to="/cbd" class="btn btn-ghost">Le CBD</NuxtLink></li>
            <li><NuxtLink to="/actualites" class="btn btn-ghost">Actualités</NuxtLink></li>
            <li><NuxtLink to="/contact" class="btn btn-ghost">Contact</NuxtLink></li>
          </ul>
        </div>

        <!-- Panier toujours visible -->
        <div class="navbar-end">
          <MiniCart />
        </div>
      </div>

      <!-- Contenu principal -->
      <main class="flex-grow">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="footer p-10 bg-primary text-white">
        <div>
          <span class="footer-title">La Ferme du Campeyrigoux</span>
          <p>Saint Sébastien d'Aigrefeuille</p>
          <p>Agriculture biologique</p>
        </div>
        <div>
          <span class="footer-title">Contact</span>
          <p class="link link-hover">Email: contact@ferme-campeyrigoux.fr</p>
          <p class="link link-hover">Tél: 06 XX XX XX XX</p>
        </div>
        <div>
          <span class="footer-title">Réseaux sociaux</span>
          <div class="grid grid-flow-col gap-4">
            <a class="btn btn-ghost btn-square"><Icon name="mdi:facebook" size="24" /></a>
            <a class="btn btn-ghost btn-square"><Icon name="mdi:instagram" size="24" /></a>
          </div>
        </div>
      </footer>
    </div>

    <!-- Sidebar mobile -->
    <div class="drawer-side z-50">
      <label for="drawer-toggle" class="drawer-overlay"></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-100">
        <li><NuxtLink to="/">Accueil</NuxtLink></li>
        <li><NuxtLink to="/boutique">Boutique CBD</NuxtLink></li>
        <li><NuxtLink to="/cbd">Le CBD</NuxtLink></li>
        <li><NuxtLink to="/actualites">Actualités</NuxtLink></li>
        <li><NuxtLink to="/contact">Contact</NuxtLink></li>
      </ul>
    </div>
  </div>
</template>
