import { spawnSync } from 'node:child_process'

const result = spawnSync(
  process.execPath,
  ['--experimental-strip-types', './scripts/db-migrate.mjs', 'sqlite', ...process.argv.slice(2)],
  {
    cwd: process.cwd(),
    stdio: 'inherit'
  }
)

process.exit(result.status ?? 0)
