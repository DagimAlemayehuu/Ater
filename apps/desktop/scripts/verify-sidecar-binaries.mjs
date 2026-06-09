import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

const targetMap = {
  'darwin-arm64': { triple: 'aarch64-apple-darwin', ext: '' },
  'darwin-x64': { triple: 'x86_64-apple-darwin', ext: '' },
  'win32-x64': { triple: 'x86_64-pc-windows-msvc', ext: '.exe' },
  'win32-arm64': { triple: 'aarch64-pc-windows-msvc', ext: '.exe' }
}

const releaseTargets = [
  targetMap['darwin-arm64'],
  targetMap['darwin-x64'],
  targetMap['win32-x64']
]

function currentTarget() {
  const explicit = process.env.ATER_TARGET_TRIPLE || process.env.TAURI_ENV_TARGET_TRIPLE
  if (explicit) {
    return {
      triple: explicit,
      ext: explicit.includes('windows') || explicit.includes('pc-windows') ? '.exe' : ''
    }
  }

  const target = targetMap[`${process.platform}-${process.arch}`]
  if (!target) {
    throw new Error(`Unsupported sidecar build host: ${process.platform}-${process.arch}`)
  }
  return target
}

const targets = process.argv.includes('--all-release-targets') ? releaseTargets : [currentTarget()]
const missing = targets
  .map(({ triple, ext }) => `ater-api-${triple}${ext}`)
  .filter(name => !existsSync(resolve('src-tauri', 'binaries', name)))

if (missing.length > 0) {
  console.error('Missing Tauri sidecar binary target(s):')
  for (const name of missing) {
    console.error(`  src-tauri/binaries/${name}`)
  }
  console.error('Build the PyInstaller sidecar with the Tauri target-triple naming convention before packaging.')
  process.exit(1)
}

console.log(`Verified ${targets.length} sidecar binary target(s).`)
