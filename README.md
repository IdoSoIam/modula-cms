# Modula CMS, CMS multi-site modulaire

Modula CMS est un CMS multi-site construit avec Nuxt 4, Vue 3, TypeScript, Prisma, Cloudflare D1/R2 et DaisyUI. Le projet regroupe une interface publique, un back-office et une API Nitro dans une application Nuxt unique, avec une base SQLite pour certains usages locaux et D1 pour le runtime Cloudflare.

Historique : Modula CMS a d'abord été développé pour la Ferme du Campeyrigoux, puis a évolué vers un CMS multi-site modulaire.

## Stack technique

- Nuxt 4 avec Nitro, preset Cloudflare module.
- Vue 3 et TypeScript.
- Prisma 7 avec adaptateurs SQLite et Cloudflare D1.
- Cloudflare Workers via Wrangler, avec D1 pour les données applicatives.
- Cloudflare R2 pour le stockage des images quand le runtime Cloudflare est disponible.
- Tailwind CSS 4 et DaisyUI 5 pour les composants et les thèmes.
- `@nuxtjs/i18n` avec `vue-i18n` dans l'arbre de dépendances pour l'internationalisation.
- Pinia et TanStack Vue Query côté interface.
- Tiptap pour les contenus éditoriaux enrichis.
- `bcryptjs` pour le hash des mots de passe.
- Connecteurs email présents dans le code, dont Gmail et Resend. Vérifier la configuration et l'installation effective du paquet Resend avant de l'activer en production.
- `nitro-cloudflare-dev` pour rapprocher le développement local du runtime Cloudflare.

## Architecture

Le dépôt est une application Nuxt monorepo :

- `pages/` contient les vues publiques, l'administration et les pages d'activation utilisateur.
- `components/` contient les composants Vue, dont les blocs CMS et les composants d'interface.
- `server/api/` expose les routes API Nitro pour le CMS, l'admin, l'authentification et les modules métier.
- `server/services/` et `server/utils/` portent la logique serveur partagée.
- `shared/` contient les contrats et helpers communs, par exemple le page builder, les routes admin, les thèmes et la résolution CMS.
- `prisma/schema.prisma` décrit les modèles applicatifs, avec Prisma configuré pour SQLite côté schéma et D1 côté runtime Cloudflare.
- `migrations/` contient les migrations SQL utilisées par les scripts locaux et D1.
- `wrangler.jsonc` déclare le Worker, le binding D1 `DB`, le bucket R2 `UPLOADS_BUCKET` et les variables Cloudflare.

Le runtime utilise en pratique trois bases :

- SQLite locale Prisma : `prisma/local.db`.
- D1 locale Wrangler : utilisée par `npm run dev` et `npm run preview`.
- D1 distante Cloudflare : utilisée après `npm run deploy`.

Points importants :

- `npm run dev` ne lit pas `prisma/local.db`.
- Avec `nitro-cloudflare-dev`, `npm run dev` utilise le binding Cloudflare local, donc la D1 locale Wrangler.
- `npm run preview` utilise aussi la D1 locale Wrangler via `wrangler dev --local`.
- `npm run db:studio` ouvre Prisma Studio sur `prisma/local.db`, pas sur la D1 locale.
- Le stockage image utilise R2 quand le runtime Cloudflare est disponible, avec un fallback local en base pour certains usages de développement.

## Fonctionnalités vérifiées dans le code

- CMS multi-site basé sur la résolution de pages publiques et la configuration de site.
- Page builder visuel autour du modèle `CmsPage` et des blocs déclarés dans `shared/pageBuilder.ts`.
- Événements avec modèles `Event`, occurrences, réservations publiques et participations internes.
- Actualités avec le modèle `Article`.
- Rôles et permissions avec `Role`, `RolePermission` et les permissions par module.
- Rôles associatifs cumulables avec `MemberRole` et `UserMemberRole`.
- Thèmes DaisyUI configurables via `shared/themes.ts`, appliqués par `useTheme`.
- i18n Nuxt avec locales `fr` et `en`, stratégie `prefix_except_default` et configuration `i18n.config.ts`.
- Invitations utilisateur sans mot de passe via `PasswordSetupToken`, les routes `/password-setup/[token]` et le service d'authentification.
- Feature flags dans `siteConfig.featureFlags`, utilisés pour piloter les modules exposés côté public et admin.
- Gestion d'images via Nuxt Image, Cloudflare Images et R2 selon la configuration runtime.

## Page builder

Le page builder stocke les pages CMS dans `CmsPage`. Les blocs, variantes et options de rendu sont typés dans `shared/pageBuilder.ts`, puis rendus côté public par les composants CMS. La résolution des pages passe par l'API CMS et les helpers partagés pour combiner contenu, configuration de site, menus, footer, thème et flags actifs.

## Événements et actualités

Le module événements s'appuie sur `Event`, `EventOccurrence`, `EventAudienceMemberRole`, `EventPublicReservation` et `EventInternalParticipation`. Il couvre les événements datés, les occurrences et les publics liés aux rôles associatifs quand la fonctionnalité est active.

Le module actualités repose sur `Article` et ses routes API. Il est exposé comme contenu éditorial publié, avec auteur et métadonnées stockés en base.

## Rôles et permissions

Les droits d'administration sont modélisés avec `Role` et `RolePermission`. Les permissions sont stockées par module avec les capacités lecture, création, modification et suppression.

Les rôles associatifs sont séparés des rôles d'administration. Ils peuvent être cumulés sur un utilisateur via `UserMemberRole` et sont utilisés par certains modules, notamment les événements.

## Thèmes, i18n et feature flags

Les thèmes DaisyUI sont centralisés dans `shared/themes.ts`. Le thème actif est appliqué via l'attribut `data-theme`, avec une liste de thèmes publics et un thème sombre par défaut si configuré.

L'i18n est configurée dans `nuxt.config.ts` avec `@nuxtjs/i18n`, les locales `fr` et `en`, et le fichier `i18n.config.ts` pour `vue-i18n`.

Les feature flags sont lus depuis `siteConfig.featureFlags`. Ils servent à masquer ou désactiver des modules dans les routes publiques, les menus admin et certaines API.

## Invitations utilisateur

Le flux d'invitation crée un utilisateur inactif sans mot de passe, génère un token stocké côté serveur, puis propose un lien public de configuration. Les routes `/api/auth/password-setup/[token]` valident et consomment ce token. La page `/password-setup/[token]` permet à l'utilisateur de créer son mot de passe.

## Commandes

### Développement

- `npm run dev` : lance Nuxt en développement avec la D1 locale Wrangler.
- `npm run dev:reset` : nettoie l'état Nuxt puis relance le serveur de développement.
- `npm run build` : construit l'application Nuxt.
- `npm run preview` : construit l'application puis lance un preview Cloudflare local avec `wrangler --cwd .output dev --local`.
- `npm run generate` : lance la génération Nuxt.
- `npm run cf-typegen` : génère les types Wrangler.

### Prisma et bases locales

- `npm run db:generate` : génère le client Prisma.
- `npm run db:local:migrate` : applique les migrations SQL sur la SQLite locale.
- `npm run db:local:reset` : recrée `prisma/local.db` depuis les migrations.
- `npm run db:studio` : ouvre Prisma Studio sur `prisma/local.db`.
- `npm run db:studio:d1:local` : exporte la D1 locale vers `prisma/d1-local-studio.db`, puis ouvre Prisma Studio sur ce miroir.
- `npm run db:d1:seed:cms-local` : injecte les données CMS locales prévues par le script de seed.

### Migrations et requêtes D1

- `npm run db:d1:migrate:local` : applique les migrations sur la D1 locale Wrangler.
- `npm run db:d1:migrate:remote` : applique les migrations sur la D1 distante Cloudflare.
- `npm run db:d1:query:local -- "SELECT * FROM User;"` : exécute une requête SQL sur la D1 locale.
- `npm run db:d1:query:remote -- "SELECT * FROM User;"` : exécute une requête SQL sur la D1 distante.

### Synchronisation des bases

- `npm run db:d1:import:sqlite-local` : copie les données de `prisma/local.db` vers la D1 locale.
- `npm run db:d1:push:prod` : copie les données de la D1 locale vers la D1 distante.
- `npm run db:d1:pull:prod` : copie les données de la D1 distante vers la D1 locale.

Notes sur ces commandes :

- Elles réappliquent les migrations sur la cible avant import.
- Elles remplacent les données applicatives de la cible.
- Elles ne fusionnent pas des environnements.
- `db:d1:push:prod` est destructrice pour les données actuelles de production.
- `db:d1:pull:prod` écrase les données actuelles de la D1 locale.

### R2 et images

- `npm run r2:push:prod` : synchronise les fichiers locaux vers R2 distant.
- `npm run r2:pull:prod` : synchronise R2 distant vers le stockage local.
- `npm run images:optimize:r2:remote` : optimise les images R2 distantes.
- `npm run images:optimize:r2:remote:dry` : simule l'optimisation des images R2 distantes.
- `npm run images:optimize:r2:local` : optimise les images R2 locales.
- `npm run images:optimize:r2:local:dry` : simule l'optimisation des images R2 locales.

## Déploiement Cloudflare

Le déploiement cible Cloudflare Workers avec Wrangler. La configuration actuelle déclare :

- le Worker `modula-cms` ;
- le binding D1 `DB` ;
- le bucket R2 `UPLOADS_BUCKET` ;
- le binding `IMAGE_RESIZER` pour Cloudflare Images ;
- les variables runtime dans `wrangler.jsonc`.

Avant un déploiement réel :

1. Créer ou vérifier la base D1 distante.
2. Créer ou vérifier le bucket R2 déclaré dans `wrangler.jsonc`.
3. Vérifier que `wrangler.jsonc` contient le bon `database_id`.
4. Configurer les secrets et variables nécessaires hors dépôt.
5. Lancer `npm run db:d1:migrate:remote`.
6. Lancer `npm run deploy`.

Pour déployer le code et le schéma :

1. `npm run db:d1:migrate:remote`
2. `npm run deploy`

Pour déployer le code, le schéma et les données de la D1 locale vers la production :

1. `npm run db:d1:migrate:remote`
2. `npm run db:d1:push:prod`
3. `npm run deploy`

Attention : `npm run db:d1:push:prod` remplace les données applicatives actuelles de la base distante. Vérifier la cible Wrangler et le `database_id` avant de lancer cette commande.

Vérification utile après déploiement :

```sh
npm run db:d1:query:remote -- "SELECT id, email, role FROM User;"
```
