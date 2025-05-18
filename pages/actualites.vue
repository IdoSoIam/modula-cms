<script setup lang="ts">
    // À compléter avec l'ID de la page Facebook
    const FACEBOOK_PAGE_ID = 'VOTRE_ID_PAGE_FACEBOOK';

    onMounted(() => {
    // Initialisation du SDK Facebook
    window.fbAsyncInit = function() {
        FB.init({
        appId: 'VOTRE_APP_ID', // À remplacer par votre App ID Facebook
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v18.0'
        });
    };

    // Chargement du SDK Facebook
    (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s) as HTMLScriptElement;
        js.id = id;
        js.src = "https://connect.facebook.net/fr_FR/sdk.js";
        fjs?.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
    });
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold text-center mb-12">Nos actualités</h1>

    <div class="max-w-3xl mx-auto">
      <!-- Intégration du flux Facebook -->
      <div 
        class="fb-page" 
        :data-href="`https://www.facebook.com/${FACEBOOK_PAGE_ID}`"
        data-tabs="timeline"
        data-width="500"
        data-height="800"
        data-small-header="false"
        data-adapt-container-width="true"
        data-hide-cover="false"
        data-show-facepile="true"
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

      <!-- Message de secours si le flux ne charge pas -->
      <div class="text-center mt-8">
        <p class="text-gray-600">
          Si le flux Facebook ne s'affiche pas, vous pouvez nous suivre directement sur 
          <a 
            :href="`https://www.facebook.com/${FACEBOOK_PAGE_ID}`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary hover:underline"
          >
            notre page Facebook
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
