Ce dossier n'est plus la source de vérité des migrations exécutées.

Source active :
- `prisma/schema.prisma` pour le modèle Prisma et la génération de types
- `migrations/` à la racine pour les migrations SQL réellement appliquées par :
  - `scripts/apply-local-migrations.mjs`
  - `wrangler d1 migrations apply`

Règle projet :
1. mettre à jour `prisma/schema.prisma`
2. écrire la migration SQL canonique dans `migrations/`
3. appliquer la migration via SQLite locale ou D1

Ce dossier est conservé comme archive historique et ne doit plus être utilisé comme source d'exécution.
