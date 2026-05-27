import { load, Store } from '@tauri-apps/plugin-store'

const STORE_FILENAME = 'ater_config.json'
let storePromise: Promise<Store> | null = null

class MockStore {
  private data: Record<string, any> = {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.data[key] as T
  }

  async set(key: string, value: any): Promise<void> {
    this.data[key] = value
  }

  async save(): Promise<void> {}

  async delete(key: string): Promise<boolean> {
    const existed = key in this.data
    delete this.data[key]
    return existed
  }
}

export function getAppStore(): Promise<Store> {
  if (!storePromise) {
    const tauriLoad = load(STORE_FILENAME, { defaults: {}, autoSave: true })
    const timeout = new Promise<Store>((_, reject) =>
      setTimeout(() => reject(new Error('Tauri Store Load Timeout')), 1500)
    )
    storePromise = Promise.race([tauriLoad, timeout])
      .catch(err => {
        console.warn('[Store] Falling back to MockStore due to:', err)
        return new MockStore() as unknown as Store
      })
  }
  return storePromise
}
