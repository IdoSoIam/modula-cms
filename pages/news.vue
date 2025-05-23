<script setup lang="ts">
interface FacebookSDK {
  init(params: { xfbml: boolean; version: string }): void;
  XFBML?: {
    parse?: () => void;
  };
}

declare global {
  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
  }
}

const FACEBOOK_PAGE_ID = "61571709076079";

// Configuration initiale de la page
definePageMeta({
  layout: "default",
});

// Fonction pour initialiser Facebook SDK
const initFacebookSDK = () => {
  return new Promise<void>((resolve) => {
    const initSDK = () => {
      window.FB?.init({
        xfbml: true,
        version: "v18.0",
      });
      // Parse XFBML after initialization
      if (window.FB?.XFBML?.parse) {
        window.FB.XFBML.parse();
      }
      resolve();
    };

    // Si le SDK est déjà chargé
    if (window.FB) {
      initSDK();
      return;
    }

    // Définir fbAsyncInit avant de charger le script
    window.fbAsyncInit = initSDK;

    // Si le script existe déjà, ne pas le recharger
    if (document.getElementById("facebook-jssdk")) {
      return;
    }

    // Chargement du SDK
    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/fr_FR/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.id = "facebook-jssdk";
    document.body.appendChild(script);
  });
};

// Préchargement des domaines Facebook
const preloadFacebookDomains = () => {
  const links = [
    { rel: "preconnect", href: "https://connect.facebook.net" },
    { rel: "preconnect", href: "https://www.facebook.com" },
  ];

  links.forEach((link) => {
    if (!document.querySelector(`link[href="${link.href}"]`)) {
      const linkEl = document.createElement("link");
      linkEl.rel = link.rel;
      linkEl.href = link.href;
      document.head.appendChild(linkEl);
    }
  });
};

// Nettoyage du SDK Facebook
const cleanupFacebookSDK = () => {
  const script = document.getElementById("facebook-jssdk");
  if (script) {
    script.remove();
  }
  delete window.FB;
  delete window.fbAsyncInit;
};

onMounted(async () => {
  preloadFacebookDomains();
  await initFacebookSDK();
});

onBeforeUnmount(() => {
  cleanupFacebookSDK();
});
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center mb-8">Nos actualités</h1>
    </div>

    <!-- Container optimisé pour le flux Facebook -->
    <div class="w-full flex justify-center items-center min-h-[800px] px-4">
      <div
        class="fb-page"
        :data-href="`https://www.facebook.com/${FACEBOOK_PAGE_ID}`"
        data-tabs="timeline"
        data-width="800"
        data-height="800"
        data-small-header="false"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="false"
      >
        <blockquote
          :cite="`https://www.facebook.com/${FACEBOOK_PAGE_ID}`"
          class="fb-xfbml-parse-ignore"
        >
          <a :href="`https://www.facebook.com/${FACEBOOK_PAGE_ID}`">
            La Ferme du Campeyrigoux
          </a>
        </blockquote>
      </div>
    </div>

    <!-- Message de secours avec style amélioré -->
    <div class="text-center mt-8">
      <div class="alert alert-info max-w-lg mx-auto">
        <Icon name="mdi:facebook" class="w-6 h-6" />
        <span>
          Si le flux ne s'affiche pas, retrouvez-nous sur
          <a
            :href="`https://www.facebook.com/${FACEBOOK_PAGE_ID}`"
            target="_blank"
            rel="noopener noreferrer"
            class="link link-primary font-semibold"
          >
            notre page Facebook
          </a>
        </span>
      </div>
    </div>
  </div>
</template>
