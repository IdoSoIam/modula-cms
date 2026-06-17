# Modula CMS

Modula CMS est un CMS modulaire construit avec `Nuxt 4`, `Vue 3`, `TypeScript` et un client de données interne généré. Le projet regroupe :

- un site public
- une administration complète
- un système d’installation
- des modèles de site versionnés
- un mécanisme de publication de releases et de mise à jour d’instance

Le CMS peut tourner dans deux contextes principaux :

- serveur Node classique avec `SQLite + filesystem`
- Cloudflare avec `D1 + R2 + Workers`

## Objectif du dépôt

Ce dépôt contient le socle CMS. Il peut être utilisé :

- en développement local
- comme base de build pour publier des releases
- comme source d’un projet hôte ou d’un clone d’instance
- comme cœur fonctionnel d’une installation client

## Stack technique

- `Nuxt 4`
- `Nitro`
- `Vue 3`
- `TypeScript`
- client de données interne généré
- `better-sqlite3` pour SQLite
- `Cloudflare D1` pour le mode Cloudflare
- `Cloudflare R2` pour les fichiers et images en mode Cloudflare
- `Tailwind CSS 4`
- `DaisyUI 5`
- `Pinia`
- `TanStack Vue Query`
- `Tiptap`
- `bcryptjs`
- `Wrangler`

## Architecture générale

Le dépôt contient principalement :

- `pages/` : pages publiques, admin, installation
- `components/` : composants UI, layout, CMS, page builder
- `server/api/` : endpoints Nitro
- `server/utils/` : logique serveur transversale
- `server/services/` : services métier
- `shared/` : types et contrats partagés
- `schema/` : schéma source du client de données
- `server/generated/` : artefacts générés commités
- `migrations/` : migrations SQL canoniques
- `scripts/` : build, publication, migration, sync, update runtime

## Drivers et runtimes

La configuration de plateforme repose principalement sur :

- `CMS_DB_DRIVER=sqlite|d1`
- `CMS_STORAGE_DRIVER=fs|r2`
- `CMS_RUNTIME_TARGET=server|cloudflare`

Combinaisons supportées dans l’état actuel :

- `server + sqlite + fs`
- `cloudflare + d1 + r2`

## Développement local

### Démarrage principal

```powershell
npm install
npm run dev
```

Le script `dev` lance le flux local standard du CMS.

### Réinitialisation locale

```powershell
npm run dev:reset
```

## Scripts disponibles

### Développement et build

- `npm run dev`
- `npm run dev:reset`
- `npm run postinstall`
- `npm run release:build`
- `npm run release:publish`
- `npm run release:publish:git`

### Base de données interne

- `npm run db:generate:internal`
- `npm run db:migrate`
- `npm run db:migrate:status`
- `npm run db:migrate:scaffold`

### Cloudflare

- `npm run cms:dev:cloudflare`
- `npm run cms:build:cloudflare`
- `npm run cms:deploy:cloudflare`
- `npm run cms:db:d1:migrate:local`
- `npm run cms:db:d1:migrate:remote`
- `npm run cms:db:d1:migrate:status:local`
- `npm run cms:db:d1:migrate:status:remote`
- `npm run cms:db:d1:pull:prod`
- `npm run cms:db:d1:push:prod`
- `npm run cms:r2:pull:prod`
- `npm run cms:r2:push:prod`

### Registre

- `npm run registry:seed:bundled`

## Migrations

Le schéma source n’est pas la migration.

Le flux attendu est :

1. modifier le schéma TypeScript source
2. regénérer les artefacts internes
3. créer une migration SQL explicite dans `migrations/`
4. appliquer cette migration sur le moteur concerné

Source de vérité :

- le schéma source sert à générer les artefacts runtime
- les migrations SQL servent à faire évoluer les bases existantes

Pour une base vide, le projet peut appliquer un bootstrap SQL complet généré à partir du schéma source.

## Modèles de site

Le CMS gère des modèles de site versionnés. Un modèle contient notamment :

- les réglages CMS
- la navigation
- les pages éditoriales
- la configuration de thème
- les feature flags
- les assets référencés par ce snapshot

### Sources possibles

Le CMS peut lister :

- les modèles système
- les modèles custom d’un registre configuré sur l’instance
- un fallback local minimal si aucun registre n’est joignable

### Règle produit importante

Le fallback local ne sert que de secours.

En fonctionnement normal :

- les modèles système viennent du registre système
- les modèles personnalisés viennent du registre custom de l’instance si configuré

## Registre système et registre custom

Le CMS distingue deux registres logiques.

### Registre système

Le registre système est l’URL embarquée dans le package. Il sert à distribuer :

- les modèles système
- les releases partagées
- la logique de mise à jour centralisée

Sans configuration custom, une instance peut :

- consulter les modèles système
- appliquer un modèle système
- voir les releases disponibles si l’instance utilise le système de mise à jour central

Sans clé propriétaire adaptée, une instance ne peut pas :

- créer un nouveau modèle système
- mettre à jour un modèle système
- supprimer un modèle système

Le modèle d’accès système est volontairement simple :

- lecture publique
- mutation système uniquement avec la clé système

### Registre custom

Le registre custom est configuré par instance via l’installation ou l’admin avec :

- une URL
- une clé API

Si vous voulez héberger et gérer votre propre registre custom, le dépôt associé est :

- [IdoSoIam/modula-cms-registry](https://github.com/IdoSoIam/modula-cms-registry)

Quand un registre custom est configuré, il est fusionné à la même interface que le registre système.

L’instance peut alors, selon les capacités réelles renvoyées par le registre :

- créer ses propres modèles
- mettre à jour ses modèles
- supprimer ses modèles
- publier ses versions de modèles

Si aucune URL custom n’est renseignée mais qu’une clé registre est fournie, le CMS tente cette clé contre le registre système embarqué. Cela permet à l’owner de gérer les modèles système depuis son instance sans rendre l’URL système modifiable.

## Règles de gestion des modèles selon la configuration

### Cas 1 : pas de registre custom

Dans ce cas :

- les modèles système restent visibles
- le changement de modèle de site reste possible
- la création de nouveaux modèles est indisponible
- la mise à jour de modèles distants est indisponible
- la suppression de modèles distants est indisponible
- les mises à jour applicatives sont pilotées par le registre système

### Cas 2 : registre custom configuré

Dans ce cas :

- les modèles système restent visibles
- les modèles custom sont ajoutés à la même liste
- les droits de mutation dépendent de l’introspection réelle du registre
- vous gérez vos propres modèles
- vous gérez aussi vos propres releases et votre propre cycle de mise à jour si votre registre le permet

## Mises à jour applicatives

Le CMS inclut une interface de consultation et de déclenchement de mises à jour d’instance.

Le principe retenu est :

- une release est buildée à partir du socle CMS
- cette release est publiée dans un registre
- une instance consomme une archive versionnée
- la mise à jour runtime est exécutée localement par le moteur intégré

### Si aucun registre custom n’est configuré

- les releases viennent du registre système
- la stratégie de mise à jour est pilotée par le registre système

### Si un registre custom est configuré

- vos releases peuvent venir de votre propre registre
- vous gérez votre propre canal de mise à jour
- vous gérez vos propres publications et déploiements

## Publication de release

Flux typique :

1. build d’une release runtime
2. création d’une archive versionnée
3. publication au registre
4. consommation par les instances

### Build

```powershell
npm run release:build
```

### Publication

```powershell
npm run release:publish -- 0.1.x
```

### Publication avec workflow git

```powershell
npm run release:publish:git -- 0.1.x
```

Le script `release:publish:git` est prévu pour publier une release avec le flux git associé, alors que `release:publish` reste utile pour les tests, le dev et les publications sans automatisation git.

## Installation

Le processus `/install` permet :

- de créer l’admin initial
- d’appliquer un modèle de site
- d’enregistrer optionnellement un registre custom d’instance

Les champs registre sont optionnels.

Si aucun registre custom n’est fourni :

- l’instance reste compatible avec le registre système
- les modèles système restent applicables

## Cloudflare

Le mode Cloudflare repose sur :

- `D1` pour les données
- `R2` pour les assets et uploads
- `Wrangler` pour le dev et le déploiement

### Développement Cloudflare

```powershell
npm run cms:dev:cloudflare
```

### Build Cloudflare

```powershell
npm run cms:build:cloudflare
```

### Déploiement Cloudflare

```powershell
npm run cms:db:d1:migrate:remote
npm run cms:deploy:cloudflare
```

### Synchronisation D1/R2

```powershell
npm run cms:db:d1:pull:prod
npm run cms:db:d1:push:prod
npm run cms:r2:pull:prod
npm run cms:r2:push:prod
```

Attention :

- `cms:db:d1:push:prod` remplace les données distantes
- `cms:db:d1:pull:prod` écrase la copie locale D1
- ces commandes ne fusionnent pas les environnements

## Données et stockage

Selon la plateforme :

- `sqlite` stocke la base localement
- `d1` stocke la base dans Cloudflare
- `fs` stocke les fichiers localement
- `r2` stocke les fichiers dans Cloudflare R2

Les assets de modèles partagés ne sont pas censés rester dispersés dans chaque instance. Le registre sert de source centrale pour les assets système des modèles.

## Email

Le CMS expose une personnalisation email avec :

- nom de marque
- logo email
- footer
- couleurs

Fallback branding utilisé dans les emails transactionnels :

1. logo email dédié
2. logo global du site
3. fallback projet

## Authentification et administration

Le CMS inclut notamment :

- authentification admin
- invitations utilisateur
- rôles et permissions
- modules activables via feature flags

## Modules fonctionnels présents

Selon la configuration et les flags actifs, le socle peut couvrir :

- pages éditoriales CMS
- navigation
- actualités
- événements
- rôles associatifs
- boutique et paniers
- réglages globaux
- thèmes
- médiathèque
- modèles de site
- mises à jour

## Notes importantes

- le code métier ne doit plus dépendre de Prisma
- les artefacts générés du client de données sont commités
- les migrations SQL restent explicites
- le registre décide des vraies capacités de mutation via introspection
- une instance sans registre custom reste capable de changer de modèle système, mais pas de publier ou muter de nouveaux modèles distants

## Dépôts liés

L’écosystème complet peut inclure d’autres briques séparées, par exemple :

- un registre central Cloudflare
- une ou plusieurs instances hôtes
- un projet de présentation servant de cockpit ou de modèle de déploiement

Dépôts associés :

- registre : [IdoSoIam/modula-cms-registry](https://github.com/IdoSoIam/modula-cms-registry)
- instance de présentation : [IdoSoIam/modula-cms-presentation](https://github.com/IdoSoIam/modula-cms-presentation)

Ce dépôt reste le socle CMS principal.

## Support de production Node

Pour un hébergement Node classique en production, le dépôt de référence n’est pas ce socle seul mais l’instance hôte :

- [IdoSoIam/modula-cms-presentation](https://github.com/IdoSoIam/modula-cms-presentation)

`modula-cms-presentation` sert de support de production Node :

- structure d’instance prête à déployer
- conventions de runtime `current/`, `releases/`, `shared/`
- intégration du moteur de mise à jour
- configuration réaliste d’une instance cliente

En pratique :

- `modula-cms` = socle CMS, logique métier, admin, build de releases
- `modula-cms-presentation` = exemple concret d’instance Node de production à cloner ou adapter

## Contribution

Le dépôt accepte les contributions, mais avec quelques règles simples pour garder une base cohérente.

### Principes

- ne pas réintroduire `Prisma` dans le runtime
- ne pas ajouter de logique métier directement couplée à un moteur SQL particulier dans les endpoints
- garder le schéma source, les artefacts générés et les migrations SQL cohérents entre eux
- préserver la compatibilité `SQLite` et `D1`
- éviter d’ajouter des dépendances lourdes sans justification claire, surtout pour les cibles Cloudflare

### Workflow recommandé

1. créer une branche de travail
2. modifier le schéma source si nécessaire
3. régénérer les artefacts internes
4. ajouter ou ajuster la migration SQL explicite
5. vérifier le fonctionnement local
6. ouvrir une PR avec le contexte fonctionnel et technique

### Si vous contribuez sur les templates et releases

- sans registre custom, vous consommez surtout les modèles système
- avec un registre custom, vous gérez vos propres modèles et vos propres releases
- le registre système reste la source officielle des modèles partagés fournis par défaut

## Licence

Ce projet est distribué sous licence `GNU GPL v3.0`.

Concrètement, cela implique notamment :

- vous pouvez utiliser, étudier et modifier le code
- vous pouvez redistribuer le projet ou une version modifiée
- si vous redistribuez une version modifiée, vous devez conserver la même famille de licence GPL
- le code source correspondant doit rester accessible aux destinataires de cette redistribution

Le texte complet de la licence est fourni dans le fichier [LICENSE](D:/Works/modula-cms/LICENSE).
