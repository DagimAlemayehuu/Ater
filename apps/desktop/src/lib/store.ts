import { load, Store } from '@tauri-apps/plugin-store'

const STORE_FILENAME = 'ater_config.json'
let storePromise: Promise<Store> | null = null

class MockStore {
  private data: Record<string, any> = {}

  constructor() {
    try {
      const saved = localStorage.getItem('ater_mock_store')
      if (saved) {
        this.data = JSON.parse(saved)
      }
    } catch (e) {
      console.warn('[MockStore] Failed to read from localStorage:', e)
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.data[key] as T
  }

  async set(key: string, value: any): Promise<void> {
    this.data[key] = value
    this.saveToLocalStorage()
  }

  async save(): Promise<void> {
    this.saveToLocalStorage()
  }

  async delete(key: string): Promise<boolean> {
    const existed = key in this.data
    delete this.data[key]
    this.saveToLocalStorage()
    return existed
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('ater_mock_store', JSON.stringify(this.data))
    } catch (e) {
      console.warn('[MockStore] Failed to write to localStorage:', e)
    }
  }
}

export function getAppStore(): Promise<Store> {
  if (!storePromise) {
    if (typeof window === 'undefined' || !(window as any).__TAURI_INTERNALS__) {
      console.info('[Store] Running outside Tauri environment. Fallback to MockStore.');
      storePromise = Promise.resolve(new MockStore() as unknown as Store);
    } else {
      storePromise = load(STORE_FILENAME, { defaults: {}, autoSave: true })
        .catch(err => {
          console.warn('[Store] Failed to load Tauri Store. Fallback to MockStore:', err);
          return new MockStore() as unknown as Store;
        });
    }
  }
  return storePromise;
}
