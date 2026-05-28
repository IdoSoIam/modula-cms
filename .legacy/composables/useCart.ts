import { useAuthStore } from '#modula/stores/auth'

export interface CartItem {
  productId: number;
  quantity: number;
}

export const useCart = () => {
  const authStore = useAuthStore();
  const cart = useState<CartItem[]>('cart', () => []);

  // Fonction pour synchroniser le panier avec le serveur
  const syncCartWithServer = async () => {
    // TODO: Implémenter la synchronisation avec le serveur
    // Exemple : await api.syncCart(cart.value);
  };
  // Synchroniser le panier avec le serveur quand l'utilisateur se connecte
  watch(() => authStore.user, async (newUser) => {
    if (newUser && cart.value.length > 0) {
      await syncCartWithServer();
    }
  });

  const total = computed(() => {
    // TODO: Implémenter le calcul du total avec les prix des produits
    return 0;
  });

  const addToCart = (productId: number, quantity: number = 1) => {
    const existingItem = cart.value.find(item => item.productId === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.value.push({ productId, quantity });
    }
  };

  const removeFromCart = (productId: number) => {
    const index = cart.value.findIndex(item => item.productId === productId);
    if (index !== -1) {
      cart.value.splice(index, 1);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const item = cart.value.find(item => item.productId === productId);
    if (item) {
      item.quantity = Math.max(0, quantity);
      if (item.quantity === 0) {
        removeFromCart(productId);
      }
    }
  };

  const clearCart = () => {
    cart.value = [];
  };

  return {
    cart,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
};
