<script setup lang="ts">
    interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    }

    const products = ref<Product[]>([
    {
        id: 1,
        name: "Huile CBD 10% Bio",
        description: "Huile CBD full spectrum 10%, extraite de nos plants cultivés en bio.",
        price: 49.90,
        image: "/images/products/huile-cbd.jpg",
        category: "Huiles"
    },
    {
        id: 2,
        name: "Fleurs CBD Amnesia",
        description: "Fleurs séchées d'Amnesia Haze CBD, culture bio en plein air.",
        price: 12.90,
        image: "/images/products/fleurs-cbd.jpg",
        category: "Fleurs"
    },
    {
        id: 3,
        name: "Infusion CBD Relaxante",
        description: "Mélange d'herbes bio et de CBD pour une détente naturelle.",
        price: 14.90,
        image: "/images/products/infusion-cbd.jpg",
        category: "Infusions"
    },
    // Ajoutez d'autres produits ici
    ]);

    const categories = computed(() => {
    return [...new Set(products.value.map(p => p.category))];
    });

    const selectedCategory = ref('');
    const searchQuery = ref('');

    const filteredProducts = computed(() => {
    return products.value.filter(product => {
        const matchesCategory = !selectedCategory.value || product.category === selectedCategory.value;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.value.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    });
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold text-center mb-12">Boutique CBD</h1>

    <!-- Filtres -->
    <div class="flex flex-col md:flex-row gap-4 mb-8">
      <div class="form-control flex-1">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un produit..."
          class="input input-bordered w-full" 
        />
      </div>
      <select 
        v-model="selectedCategory"
        class="select select-bordered w-full md:w-64"
      >
        <option value="">Toutes les catégories</option>
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
      >        <figure class="px-4 pt-4">
          <ProductImage 
            :src="product.image" 
            :alt="product.name"
            class="rounded-xl h-48 w-full" 
          />
        </figure>
        <div class="card-body">
          <h2 class="card-title">{{ product.name }}</h2>
          <p class="text-gray-600">{{ product.description }}</p>
          <div class="flex justify-between items-center mt-4">
            <span class="text-xl font-bold">{{ product.price.toFixed(2) }}€</span>
            <button class="btn btn-primary">
              Ajouter au panier
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucun produit trouvé -->
    <div v-if="filteredProducts.length === 0" class="text-center py-8">
      <p class="text-gray-600">Aucun produit ne correspond à votre recherche.</p>
    </div>
  </div>
</template>
