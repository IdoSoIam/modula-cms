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
</script>

<template>
  <div class="dropdown dropdown-end">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <div class="indicator">
        <Icon name="mdi:cart" size="24" />
        <span v-if="cartCount > 0" class="badge badge-sm indicator-item">
          {{ cartCount }}
        </span>
      </div>
    </label>
    <div tabindex="0" class="mt-3 z-[1] card card-compact dropdown-content w-52 bg-base-100 shadow">
      <div class="card-body">
        <span class="font-bold text-lg">{{ cartCount }} Articles</span>
        <span class="text-info">Total: {{ $formatPrice(total) }}</span>
        <div class="card-actions">
          <NuxtLink to="/panier" class="btn btn-primary btn-block">
            Voir le panier
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
