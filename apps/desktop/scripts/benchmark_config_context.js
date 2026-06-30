import { performance } from 'perf_hooks';

// Simulate Tauri Store
class MockStore {
  constructor() {
    this.data = {};
  }
  async get(key) {
    return this.data[key];
  }
  async set(key, value) {
    // Simulate some latency for store operation
    await new Promise(r => setTimeout(r, 1));
    this.data[key] = value;
  }
  async delete(key) {
    await new Promise(r => setTimeout(r, 1));
    delete this.data[key];
  }
  async save() {
    await new Promise(r => setTimeout(r, 5));
  }
}

async function runBenchmark() {
  const store = new MockStore();
  const entries = {};
  for (let i = 0; i < 100; i++) {
    entries[`key${i}`] = i % 2 === 0 ? `value${i}` : undefined;
  }

  const iterations = 10;

  console.log('--- Benchmarking Original Sequential Loop ---');
  let startOriginal = performance.now();
  for (let it = 0; it < iterations; it++) {
    for (const key of Object.keys(entries)) {
      const val = entries[key];
      if (val === undefined) {
        try { await store.delete(key); } catch {}
      } else {
        await store.set(key, val);
      }
    }
    await store.save();
  }
  let endOriginal = performance.now();
  console.log(`Original Time: ${(endOriginal - startOriginal).toFixed(2)}ms`);

  console.log('--- Benchmarking Promise.all ---');
  let startOptimized = performance.now();
  for (let it = 0; it < iterations; it++) {
    await Promise.all(Object.keys(entries).map(async (key) => {
      const val = entries[key];
      if (val === undefined) {
        try { await store.delete(key); } catch {}
      } else {
        await store.set(key, val);
      }
    }));
    await store.save();
  }
  let endOptimized = performance.now();
  console.log(`Optimized Time: ${(endOptimized - startOptimized).toFixed(2)}ms`);
}

runBenchmark();
