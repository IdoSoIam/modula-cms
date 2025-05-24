<script setup lang="ts">
const { cart, total } = useCart();
const { products } = useProducts();
const { $formatPrice } = useNuxtApp();

const cartItems = computed(() => {
  return cart.value.map(item => {
    const product = products.value.find(p => p.id === item.productId);
    return {
      ...item,
      product
    };
  });
});

const cartCount = computed(() => {
  return cart.value.reduce((acc, item) => acc + item.quantity, 0);
});

const cartTotal = computed(() => {
  return cartItems.value.reduce((sum, item) => {
    return sum + ((item.product?.price || 0) * item.quantity);
  }, 0);
});
</script>

<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <div class="indicator">
        <Icon name="mdi:cart" size="24" />
        <ClientOnly>
          <span v-if="cartCount > 0" class="badge badge-sm indicator-item">
            {{ cartCount }}
          </span>
        </ClientOnly>
      </div>
    </label>
    <div tabindex="0" class="mt-3 z-[1] card card-compact dropdown-content w-72 bg-base-100 shadow">
      <div class="card-body">
        <span class="font-bold text-lg">{{ cartCount }} {{ $t('cart.items') }}</span>
        <!-- Liste des produits -->
        <ClientOnly>
          <div v-if="cartCount > 0" class="max-h-48 overflow-y-auto">
            <div v-for="item in cartItems" :key="item.productId" class="flex justify-between items-center py-2">
              <div class="flex-1">
                <div class="font-medium">{{ item.product?.name }}</div>
                <div class="text-sm opacity-70">{{ item.quantity }}x {{ $formatPrice(item.product?.price || 0) }}</div>
              </div>
            </div>
          </div>
        </ClientOnly>

        <div class="divider my-0"></div>
        <div class="flex justify-between items-center font-bold">
          <span>{{ $t('cart.total') }}:</span>
          <span class="text-primary">{{ $formatPrice(cartTotal) }}</span>
        </div>

        <div class="card-actions">
          <NuxtLink to="/panier" class="btn btn-primary btn-block">
            {{ $t('cart.viewCart') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
