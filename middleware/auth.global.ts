//import { useCart } from '~/composables/useCart';

export default defineNuxtRouteMiddleware((to) => {
  // Vérifier si la route est protégée (admin)
  if (to.path.startsWith('/admin')) {
    // Pour l'instant, rediriger vers la page d'accueil
    // TODO: Implémenter l'authentification réelle
    return navigateTo('/');
  }
});
