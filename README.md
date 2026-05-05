# Ferme du Campeyrigoux

## Etat actuel

Le site couvre deja les briques principales pour publier une version utile :

- page d'accueil et page `paniers`
- reservation de paniers cote client
- 3 modes de retrait / livraison :
  - retrait a la ferme
  - point relais
  - tournee de livraison
- back-office admin pour :
  - gerer les paniers
  - gerer les legumes
  - gerer les points relais
  - gerer les tournees
  - gerer les reservations
  - gerer les parametres email / Google / fenetre de commande
- emails de confirmation / refus / annulation
- synchronisation Google Calendar
- lien public de gestion de reservation par token

## Base de donnees Cloudflare / D1

Le projet est maintenant prepare pour fonctionner avec :

- dev local Node sur SQLite : [prisma/local.db](/D:/Works/ferme-campeyrigoux/prisma/local.db:1)
- preview Cloudflare locale sur D1 local via Wrangler
- prod Cloudflare sur D1 distant
- stockage image sur R2 quand le runtime Cloudflare est disponible, avec fallback local en base pour `npm run dev`

Commandes utiles :

- `npm run db:local:reset` : recree la base locale SQLite depuis [migrations/0001_init.sql](/D:/Works/ferme-campeyrigoux/migrations/0001_init.sql:1)
- `npm run dev` : dev Nuxt local avec la base SQLite locale
- `npm run preview` : build + preview Cloudflare locale
- `npm run db:d1:migrate:local` : applique les migrations au D1 local Wrangler
- `npm run db:d1:migrate:remote` : applique les migrations au D1 distant
- `npm run db:studio` : ouvre Prisma Studio sur la base locale SQLite

Avant le vrai deploy Cloudflare :

- creer la base D1 distante
- creer aussi le bucket R2 `ferme-du-campeyrigoux-images`
- remplacer `database_id` dans [wrangler.jsonc](/D:/Works/ferme-campeyrigoux/wrangler.jsonc:1)
- lancer `npm run db:d1:migrate:remote`
- lancer `npm run deploy`

Les abonnements et l'inscription publique sont maintenant pilotables depuis [pages/admin/parametres.vue](/D:/Works/ferme-campeyrigoux/pages/admin/parametres.vue:1), au lieu d'etre bloques en dur.

## Parcours client actuel

1. Le client arrive sur la home puis ouvre [pages/paniers.vue](/D:/Works/ferme-campeyrigoux/pages/paniers.vue:1).
2. Il choisit un panier.
3. Il remplit son nom, email, telephone et son mode de retrait / livraison.
4. Il peut choisir :
   - `FARM` : retrait a la ferme
   - `PICKUP` : point relais
   - `TOUR` : tournee de livraison
5. Pour `FARM`, le formulaire propose par defaut le creneau configure dans l'admin, avec possibilite pour le client de demander une autre date / heure.
6. La reservation est creee en `PENDING` via [server/api/reservations/index.post.ts](/D:/Works/ferme-campeyrigoux/server/api/reservations/index.post.ts:1).
7. Si le retrait est a la ferme, un historique de propositions de creneaux est conserve et le client peut accepter ou contre-proposer depuis le lien public.
8. L'admin recoit une notification email.
9. L'admin confirme / refuse / annule depuis [pages/admin/reservations.vue](/D:/Works/ferme-campeyrigoux/pages/admin/reservations.vue:1).
10. Pour `FARM`, l'admin peut soit confirmer le creneau, soit envoyer une contre-proposition.
11. Le client recoit ensuite l'email de decision avec, si besoin, un lien public de gestion.

## Ce qui a deja ete fait dans les rollouts du 03/05

- ajout du retrait a la ferme dans les reservations
- ajout des champs de fulfillment dans Prisma
- ajout de la synchro Google Calendar
- ajout des emails de confirmation / annulation / refus
- ajout des tokens publics de gestion de reservation
- ajout du back-office de gestion des reservations
- ajout des points relais et des tournees
- ajout de la logique d'occurrences et notifications pour les abonnements
- ajout de l'archivage de reservations

## Decisions fonctionnelles retenues pour la publication

- pas d'abonnement pour le moment
- pas de paiement en ligne
- paiement en espece au retrait / a la remise
- inscription publique desactivee
- le mode `Retrait a la ferme` sert uniquement aux paniers reserves sur le site
- la `vente a la ferme` reste un temps de vente directe distinct pour les legumes recoltes / recoltables et les autres produits disponibles
- le creneau et l'adresse du retrait a la ferme sont parametrables dans l'admin
- en retrait a la ferme, une reservation reste une proposition tant que les deux parties n'ont pas valide le creneau

## Ce qui manque encore avant une publication sereine

### Priorite haute

- clarifier partout le paiement :
  - il faut afficher explicitement "paiement en espece, pas de paiement en ligne" dans le parcours client, les emails et idealement dans la home
- envoyer un email d'accuse de reception immediat au client apres demande :
  - aujourd'hui le client a seulement un toast local, puis attend la decision admin
- simplifier le formulaire panier pour les clients :
  - actuellement la ville / code postal apparaissent meme avant d'avoir choisi une tournee
  - il serait plus simple de demander d'abord le mode de retrait / livraison, puis d'afficher seulement les champs utiles
- verifier le contenu final des emails admin / client :
  - heures, lieu de retrait, consigne de paiement en espece, et vocabulaire "tournee / point relais / ferme"
- nettoyer les textes mal encodes visibles dans plusieurs fichiers (`â€”`, `Ã©`, etc.)

### Priorite haute cote admin

- appliquer la migration Prisma qui ajoute l'historique de propositions de creneaux ferme

- verifier que les parametres minimum sont bien renseignables avant mise en ligne :
  - email admin
  - calendrier Google cible si utilise
  - fenetre d'ouverture des commandes
  - adresse et creneau par defaut du retrait a la ferme
  - activation / desactivation des abonnements et de l'inscription publique
  - points relais actifs
  - tournees actives avec villes rattachees
- preparer un vrai process d'exploitation :
  - qui confirme les reservations
  - sous quel delai
  - comment on gere les contre-propositions de creneaux ferme
  - quand on archive les reservations terminees

### Priorite moyenne

- rendre l'adresse / ville prefillees plus intelligemment si un client connecte existe
- ajouter un message d'aide visible sur le mode `Retrait a la ferme`
- ajouter une vraie mention "vente a la ferme" plus operationnelle :
  - adresse precise
  - jours / horaires
  - eventuelle consigne de commande
- ajouter une page ou un bloc "comment ca marche"
- harmoniser les libelles admin / client

## Points de vigilance identifies dans les fichiers

- [components/AuthForm.vue](/D:/Works/ferme-campeyrigoux/components/AuthForm.vue:1) exposait encore l'inscription publique
- [server/api/auth/register.post.ts](/D:/Works/ferme-campeyrigoux/server/api/auth/register.post.ts:1) acceptait encore l'inscription
- [server/api/reservations/index.post.ts](/D:/Works/ferme-campeyrigoux/server/api/reservations/index.post.ts:1) devait revalider plus strictement la coherence `tournee <-> ville`
- [pages/paniers.vue](/D:/Works/ferme-campeyrigoux/pages/paniers.vue:1) contient encore des points de friction UX
- [pages/admin/reservations.vue](/D:/Works/ferme-campeyrigoux/pages/admin/reservations.vue:1) est deja riche, mais depend fortement de la qualite des parametres et des textes email

## Recommandation simple pour publier vite

1. Publier sans abonnement.
2. Publier sans paiement en ligne, avec message explicite "paiement en espece".
3. Garder un seul parcours principal : panier -> choix du retrait / livraison -> validation admin.
4. Garder `Retrait a la ferme` pour les paniers reserves sur le site et presenter la `vente a la ferme` comme une vente directe distincte.
5. Garder la connexion reservee a l'admin.
6. Ajouter ensuite seulement :
   - accuse de reception client
   - simplification du formulaire
   - nettoyage des textes

## Fichiers les plus importants

- client :
  - [pages/index.vue](/D:/Works/ferme-campeyrigoux/pages/index.vue:1)
  - [pages/paniers.vue](/D:/Works/ferme-campeyrigoux/pages/paniers.vue:1)
  - [pages/reservation/manage/[token].vue](/D:/Works/ferme-campeyrigoux/pages/reservation/manage/[token].vue:1)
- reservation :
  - [server/api/reservations/index.post.ts](/D:/Works/ferme-campeyrigoux/server/api/reservations/index.post.ts:1)
  - [server/utils/reservationFulfillment.ts](/D:/Works/ferme-campeyrigoux/server/utils/reservationFulfillment.ts:1)
  - [server/utils/reservationEmails.ts](/D:/Works/ferme-campeyrigoux/server/utils/reservationEmails.ts:1)
- admin :
  - [pages/admin/reservations.vue](/D:/Works/ferme-campeyrigoux/pages/admin/reservations.vue:1)
  - [pages/admin/livraison.vue](/D:/Works/ferme-campeyrigoux/pages/admin/livraison.vue:1)
  - [pages/admin/parametres.vue](/D:/Works/ferme-campeyrigoux/pages/admin/parametres.vue:1)
