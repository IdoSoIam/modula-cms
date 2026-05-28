<script setup lang="ts">
import ImagePlaceholder from "#modula/components/ImagePlaceholder.vue";
import { useProducts } from '#modula/composables/useProducts';
import { useCart } from '#modula/composables/useCart';
import type { Product } from '#modula/composables/useProducts';

const { products, fetchProducts } = useProducts();
const { addToCart } = useCart();
const { $toast } = useNuxtApp();

onMounted(() => {
  fetchProducts();
});

const categories = computed(() => {
  return [...new Set(products.value.map((p) => p.category))];
});

const selectedCategory = ref("");
const searchQuery = ref("");

const filteredProducts = computed(() => {
  return products.value.filter((product) => {
    const matchesCategory =
      !selectedCategory.value || product.category === selectedCategory.value;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.value.toLowerCase());
    return matchesCategory && matchesSearch;
  });
});
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold text-center mb-12">{{ $t('pages.shop.title') }}</h1>

    <!-- Filtres -->
    <div class="flex flex-col md:flex-row gap-4 mb-8">
      <div class="form-control gap-3 flex flex-1">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('pages.shop.searchPlaceholder')"
          class="input input-bordered w-full"
        />
      </div>
      <select v-model="selectedCategory" class="select select-bordered w-full md:w-64">
        <option value="">{{ $t('pages.shop.allCategories') }}</option>
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </div>

    <!-- Grille de produits -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
      >
        <figure class="px-4 pt-4">
          <template v-if="product.image">
            <ProductImage
              :src="product.image"
              :alt="product.name"
              class="rounded-xl h-48 w-full"
            />
          </template>
          <template v-else>
            <ImagePlaceholder class="rounded-xl h-48 w-full" />
          </template>
        </figure>
        <div class="card-body">
          <h2 class="card-title">{{ product.name }}</h2>
          <p class="text-gray-600">{{ product.description }}</p>          <div class="flex justify-between items-center mt-4">
            <span class="text-xl font-bold">{{ $formatPrice(product.price) }}</span>
            <button 
              class="btn btn-primary"
              @click="() => {
                addToCart(product.id);                $toast.success(`${product.name} ${$t('pages.shop.addedToCart')}`);
              }">
              {{ $t('pages.shop.addToCart') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucun produit trouvé -->
    <div v-if="filteredProducts.length === 0" class="text-center py-8">
      <p class="text-gray-600">{{ $t('pages.shop.noProductsFound') }}</p>
    </div>
  </div>
</template>
