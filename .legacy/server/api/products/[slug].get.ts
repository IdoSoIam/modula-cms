import { Product } from '#modula/composables/useProducts';

// Réutilisation des produits de l'endpoint principal
const getProducts = async () => {
  const products: Product[] = await $fetch('/api/products');
  return products;
};

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');
  const products = await getProducts();
  const product = products.find(p => p.slug === slug);

  if (!product) {
    throw createError({
      statusCode: 404,
      message: 'Produit non trouvé'
    });
  }

  return product;
});
