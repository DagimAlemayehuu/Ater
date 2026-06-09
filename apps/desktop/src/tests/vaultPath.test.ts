import { describe, expect, it } from 'vitest'
import { normalizeVaultPath, toVaultRelativePath, vaultChildPath } from '../lib/vaultPath'

describe('vaultPath helpers', () => {
  it('normalizes Windows dialog paths to a stable config format', () => {
    expect(normalizeVaultPath('C:\\Users\\Ada\\Obsidian Vault\\')).toBe('C:/Users/Ada/Obsidian Vault')
  })

  it('preserves POSIX absolute paths without a trailing separator', () => {
    expect(normalizeVaultPath('/Users/ada/Obsidian Vault/')).toBe('/Users/ada/Obsidian Vault')
  })

  it('joins vault child paths without duplicate separators', () => {
    expect(vaultChildPath('C:\\Users\\Ada\\Vault\\', 'Inbox')).toBe('C:/Users/Ada/Vault/Inbox')
  })

  it('converts absolute Windows vault paths to vault-relative paths', () => {
    expect(toVaultRelativePath('C:\\Users\\Ada\\Vault\\Notes\\Topic.md', 'C:\\Users\\Ada\\Vault')).toBe('Notes/Topic.md')
  })

  it('converts absolute POSIX vault paths to vault-relative paths', () => {
    expect(toVaultRelativePath('/Users/ada/Vault/Notes/Topic.md', '/Users/ada/Vault')).toBe('Notes/Topic.md')
  })

  it('rejects absolute paths outside the configured vault', () => {
    expect(() => toVaultRelativePath('C:\\Program Files\\Ater\\secret.md', 'C:\\Users\\Ada\\Vault')).toThrow(/outside the configured vault/i)
  })
})
