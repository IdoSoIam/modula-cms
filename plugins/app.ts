import { useCart } from '~/composables/useCart';
//import { Product } from '~/composables/useProducts';

export default defineNuxtPlugin((nuxtApp) => {
  // Initialiser le panier depuis le localStorage au chargement
  const initCart = () => {
    if (process.client) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const { cart } = useCart();
        cart.value = JSON.parse(savedCart);
      }
    }
  };

  // Sauvegarder le panier dans le localStorage à chaque modification
  const { cart } = useCart();
  watch(() => cart.value, (newCart) => {
    if (process.client) {
      localStorage.setItem('cart', JSON.stringify(newCart));
    }
  }, { deep: true });

  // Initialiser le panier
  initCart();
  
  return {
    provide: {
      // Vous pouvez ajouter des helpers globaux ici
      formatPrice: (price: number) => {
        // Utilise la locale actuelle pour le formatage des prix
        const locale = (useNuxtApp().$i18n?.locale?.value || 'en') === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: 'EUR'
        }).format(price);
      },

      formatDate: (dateString: string) => {
        const date = new Date(dateString)
        // Utilise la locale actuelle pour le formatage des dates
         const locale = (useNuxtApp().$i18n?.locale?.value || 'en') === 'fr' ? 'fr-FR' : 'en-US';
        return date.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
  };
});
