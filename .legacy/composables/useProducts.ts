export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  slug: string;
  stock: number;
}

export const useProducts = () => {
  const products = useState<Product[]>('products', () => []);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchProducts = async () => {
    if (products.value.length > 0) return products.value;
    
    loading.value = true;
    error.value = null;
    
    try {
      const data = await $fetch('/api/products');
      products.value = data as Product[];
      return products.value;
    } catch (e) {
      error.value = 'Erreur lors du chargement des produits';
      console.error(e);
      return [];
    } finally {
      loading.value = false;
    }
  };

  const getProduct = async (slug: string): Promise<Product | null> => {
    try {
      const data = await $fetch(`/api/products/${slug}`);
      return data as Product;
    } catch (e) {
      error.value = 'Erreur lors du chargement du produit';
      console.error(e);
      return null;
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    getProduct
  };
};
