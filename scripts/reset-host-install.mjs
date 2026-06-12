#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const cwd = process.cwd()
const localDbPath = path.resolve(cwd, 'prisma', 'local.db')
const localMigrationsTablePath = path.resolve(cwd, 'prisma', '.local-migrations.db')
const wranglerStatePath = path.resolve(cwd, '.wrangler', 'state')

function stopHostNodeProcesses() {
  if (process.platform !== 'win32') return
  try {
    const escaped = cwd.replace(/\\/g, '\\\\')
    const command = `powershell -NoProfile -Command "$procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -match '${escaped}' }; foreach ($p in $procs) { try { Stop-Process -Id $p.ProcessId -Force } catch {} }"`
    execSync(command, { stdio: 'ignore' })
  } catch {
    // best effort
  }
}

function removeIfExists(filePath) {
  if (!fs.existsSync(filePath)) return false
  fs.rmSync(filePath, { force: true })
  return true
}

function removeDirectoryIfExists(dirPath) {
  if (!fs.existsSync(dirPath)) return false
  fs.rmSync(dirPath, { recursive: true, force: true })
  return true
}

stopHostNodeProcesses()

const deletedDb = removeIfExists(localDbPath)
const deletedLocalMigrationsDb = removeIfExists(localMigrationsTablePath)
const deletedWranglerState = removeDirectoryIfExists(wranglerStatePath)

console.log(`[modula-cms] reset install terminé dans ${cwd}`)
console.log(`- local.db supprimé: ${deletedDb ? 'oui' : 'non'}`)
console.log(`- .local-migrations.db supprimé: ${deletedLocalMigrationsDb ? 'oui' : 'non'}`)
console.log(`- .wrangler/state supprimé: ${deletedWranglerState ? 'oui' : 'non'}`)
console.log('- relancez ensuite `npm run dev` puis ouvrez /install')
