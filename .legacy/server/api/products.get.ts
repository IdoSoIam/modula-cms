import { Product } from '~/composables/useProducts';

// Simulation d'une base de données
const products: Product[] = [
  {
    id: 1,
    name: "Huile CBD 10% Bio",
    description: "Huile CBD full spectrum 10%, extraite de nos plants cultivés en bio.",
    price: 49.90,
    image: "/images/products/huile-cbd.jpg",
    category: "Huiles",
    slug: "huile-cbd-10-bio",
    stock: 15
  },
  {
    id: 2,
    name: "Fleurs CBD Amnesia",
    description: "Fleurs séchées d'Amnesia Haze CBD, culture bio en plein air.",
    price: 12.90,
    image: "/images/products/fleurs-cbd.jpg",
    category: "Fleurs",
    slug: "fleurs-cbd-amnesia",
    stock: 20
  },
  // Ajoutez d'autres produits ici
];

export default defineEventHandler(async (event) => {
  // Simulation d'un délai réseau
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return products;
});
