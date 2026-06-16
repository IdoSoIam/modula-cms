Ce dossier n'est plus la source de vérité des migrations exécutées.

Source active :
- `schema/` et `server/generated/` pour le schéma source et les artefacts runtime générés
- `migrations/` à la racine pour les migrations SQL réellement appliquées par :
  - `scripts/apply-local-migrations.mjs`
  - `wrangler d1 migrations apply`

Règle projet :
1. mettre à jour le schéma source TypeScript
2. regénérer les artefacts internes
3. écrire la migration SQL canonique dans `migrations/`
4. appliquer la migration via SQLite locale ou D1

Ce dossier est conservé comme archive historique et ne doit plus être utilisé comme source d'exécution.
