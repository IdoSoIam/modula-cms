<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Mon Panier</h1>

    <div v-if="!cart" class="text-center py-8">
      <p class="text-gray-600">Votre panier est vide</p>
      <NuxtLink to="/shop" class="btn btn-primary mt-4"> Continuer mes achats </NuxtLink>
    </div>

    <!-- Liste des produits -->
    <div v-else class="flex flex-col gap-8">
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
            <tr v-for="item in cartItemsWithProducts" :key="item.productId">
              <td>
                <div class="flex items-center gap-4">
                  <div class="w-16 h-16">
                    <ProductImage
                      v-if="item.product?.image"
                      :src="item.product.image"
                      :alt="item.product.name"
                      class="rounded-lg w-full h-full object-cover"
                    />
                    <ImagePlaceholder
                      v-else
                      :alt="item.product?.name"
                      class="rounded-lg w-full h-full object-cover"
                    />
                  </div>
                  <span class="font-medium">{{ item.product?.name }}</span>
                </div>
              </td>
              <td>{{ item.product?.price.toFixed(2) }}€</td>
              <td>
                <div class="flex items-center gap-2">
                  <button class="btn btn-square btn-sm" @click="decreaseQuantity(item)">
                    -
                  </button>
                  <span class="w-8 text-center">{{ item.quantity }}</span>
                  <button class="btn btn-square btn-sm" @click="increaseQuantity(item)">
                    +
                  </button>
                </div>
              </td>
              <td>{{ ((item.product?.price || 0) * item.quantity).toFixed(2) }}€</td>
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

          <template v-if="cartItemsWithProducts.length > 0">
            <div class="py-4" v-if="!isAuthenticated">
              <div class="alert alert-warning">
                <Icon name="mdi:alert" size="24" />
                <span>Connectez-vous pour finaliser votre commande</span>
              </div>
              <AuthForm class="mt-4" />
            </div>

            <template v-else>
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
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";
import { useCart } from "~/composables/useCart";
import { usePayment } from "~/composables/usePayment";
import { useProducts } from "~/composables/useProducts";
import type { Product } from "~/composables/useProducts";
import AuthForm from "~/components/AuthForm.vue";

const { isAuthenticated, user } = useAuth();
const { cart, removeFromCart, updateQuantity } = useCart();
const { initiatePayment } = usePayment();
const { products, fetchProducts } = useProducts();

interface CartItemWithProduct {
  productId: number;
  quantity: number;
  product?: Product;
}

// Fetch products on component mount
onMounted(() => {
  fetchProducts();
});

const shipping = ref(5.99);

// Combine cart items with product details
const cartItemsWithProducts = computed<CartItemWithProduct[]>(() => {
  return cart.value.map((item) => ({
    ...item,
    product: products.value.find((p) => p.id === item.productId),
  }));
});

const subtotal = computed(() => {
  return cartItemsWithProducts.value.reduce((sum, item) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0);
});

const total = computed(() => {
  return subtotal.value + shipping.value;
});

const increaseQuantity = (item: CartItemWithProduct) => {
  updateQuantity(item.productId, item.quantity + 1);
};

const decreaseQuantity = (item: CartItemWithProduct) => {
  if (item.quantity > 1) {
    updateQuantity(item.productId, item.quantity - 1);
  }
};

const removeItem = (item: CartItemWithProduct) => {
  removeFromCart(item.productId);
};

const checkout = async () => {
  if (!isAuthenticated.value || !user.value) {
    return;
  }

  try {
    const paymentResult = await initiatePayment({
      items: cartItemsWithProducts.value.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product?.price || 0,
        name: item.product?.name || "",
      })),
      shipping: shipping.value,
      total: total.value,
      shippingAddress: user.value.shippingAddress,
    });

    if (paymentResult.success) {
      // Rediriger vers la page de confirmation
      navigateTo("/commande/confirmation");
    }
  } catch (error) {
    console.error("Erreur lors du paiement:", error);
  }
};
</script>
