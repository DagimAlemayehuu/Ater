export function normalizeVaultPath(path: string): string {
  const normalized = path.trim().replace(/\\/g, '/')
  if (/^[A-Za-z]:\/$/.test(normalized) || normalized === '/') {
    return normalized
  }
  return normalized.replace(/\/+$/g, '')
}

export function vaultChildPath(vaultPath: string, child: string): string {
  const normalizedVault = normalizeVaultPath(vaultPath)
  const normalizedChild = child.replace(/\\/g, '/').replace(/^\/+/g, '')
  return `${normalizedVault}/${normalizedChild}`
}

export function isAbsolutePath(path: string): boolean {
  const normalized = path.trim().replace(/\\/g, '/')
  return normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)
}

export function toVaultRelativePath(path: string, vaultPath: string): string {
  const normalizedPath = normalizeVaultPath(path).replace(/^\.\//, '')
  if (!isAbsolutePath(normalizedPath)) {
    if (normalizedPath === '..' || normalizedPath.startsWith('../') || normalizedPath.includes('/../')) {
      throw new Error('Vault path traversal is not allowed.')
    }
    return normalizedPath
  }

  const normalizedVault = normalizeVaultPath(vaultPath)
  if (!normalizedVault) {
    throw new Error('Cannot normalize an absolute workspace path without a configured vault.')
  }

  const pathKey = /^[A-Za-z]:\//.test(normalizedPath) ? normalizedPath.toLowerCase() : normalizedPath
  const vaultKey = /^[A-Za-z]:\//.test(normalizedVault) ? normalizedVault.toLowerCase() : normalizedVault

  if (pathKey === vaultKey) {
    return ''
  }

  const prefix = `${vaultKey}/`
  if (!pathKey.startsWith(prefix)) {
    throw new Error('Workspace file operation path is outside the configured vault.')
  }

  return normalizedPath.slice(normalizedVault.length + 1)
}
