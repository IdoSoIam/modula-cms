import { useCart } from '~/composables/useCart';
//import { Product } from '~/composables/useProducts';

export default defineNuxtPlugin(() => {
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
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR'
        }).format(price);
      },
    }
  };
});
