<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Mon Panier</h1>

    <!-- Liste des produits -->
    <div class="flex flex-col gap-8">
      <!-- Table des produits -->
      <div class="overflow-x-auto">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Prix unitaire</th>
              <th>Quantité</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cartItems" :key="item.id">
              <td>
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16">
                    <ImagePlaceholder :alt="item.name" class="rounded-lg w-full h-full object-cover" />
                  </div>
                  <span class="font-medium">{{ item.name }}</span>
                </div>
              </td>
              <td>{{ item.price }}€</td>
              <td>
                <div class="flex items-center gap-2">
                  <button class="btn btn-square btn-sm" @click="decreaseQuantity(item)">-</button>
                  <span class="w-8 text-center">{{ item.quantity }}</span>
                  <button class="btn btn-square btn-sm" @click="increaseQuantity(item)">+</button>
                </div>
              </td>
              <td>{{ (item.price * item.quantity).toFixed(2) }}€</td>
              <td>
                <button class="btn btn-ghost btn-sm" @click="removeItem(item)">
                  <Icon name="mdi:delete" size="20" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Résumé de la commande -->
      <div class="card bg-base-100 shadow-xl max-w-md ml-auto">
        <div class="card-body">
          <h2 class="card-title">Résumé de la commande</h2>
          <div class="flex justify-between py-2">
            <span>Sous-total</span>
            <span>{{ subtotal.toFixed(2) }}€</span>
          </div>
          <div class="flex justify-between py-2">
            <span>Frais de livraison</span>
            <span>{{ shipping.toFixed(2) }}€</span>
          </div>
          <div class="divider"></div>
          <div class="flex justify-between font-bold">
            <span>Total</span>
            <span>{{ total.toFixed(2) }}€</span>
          </div>
          <div class="card-actions justify-end mt-4">
            <button class="btn btn-primary" @click="checkout">
              Passer la commande
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const cartItems = ref([
  { id: 1, name: "Panier de légumes", price: 25.00, quantity: 1 },
  { id: 2, name: "Poulet Bio", price: 15.50, quantity: 2 },
  { id: 3, name: "Huile CBD 10%", price: 45.00, quantity: 1 },
]);

const shipping = ref(5.99);

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

const total = computed(() => {
  return subtotal.value + shipping.value;
});

const increaseQuantity = (item) => {
  item.quantity++;
};

const decreaseQuantity = (item) => {
  if (item.quantity > 1) {
    item.quantity--;
  }
};

const removeItem = (item) => {
  const index = cartItems.value.indexOf(item);
  if (index > -1) {
    cartItems.value.splice(index, 1);
  }
};

const checkout = () => {
  // Implémenter la logique de paiement ici
  console.log("Passage à la commande");
};
</script>
