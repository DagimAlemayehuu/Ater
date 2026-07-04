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
    await new Promise(r => {
      if (process.env.NODE_ENV === 'development') {
        setTimeout(r, 1);
      } else {
        r();
      }
    });
    this.data[key] = value;
  }
  async delete(key) {
    await new Promise(r => {
      if (process.env.NODE_ENV === 'development') {
        setTimeout(r, 1);
      } else {
        r();
      }
    });
    delete this.data[key];
  }
  async save() {
    await new Promise(r => {
      if (process.env.NODE_ENV === 'development') {
        setTimeout(r, 5);
      } else {
        r();
      }
    });
  }
}

async function runBenchmark() {
  const store = new MockStore();
  const entries = {};
  for (let i = 0; i < 100; i++) {
    entries[`key${i}`] = i % 2 === 0 ? `value${i}` : undefined;
  }

  const iterations = 10;

  if (process.env.NODE_ENV === 'development') {
    console.log('--- Benchmarking Original Sequential Loop ---');
  }
  let startOriginal = performance.now();
  for (let it = 0; it < iterations; it++) {
    for (const key of Object.keys(entries)) {
      const val = entries[key];
      if (val === undefined) {
        try { await store.delete(key); } catch { /* intentionally empty */ }
      } else {
        await store.set(key, val);
      }
    }
    await store.save();
  }
  let endOriginal = performance.now();
  if (process.env.NODE_ENV === 'development') {
    console.log(`Original Time: ${(endOriginal - startOriginal).toFixed(2)}ms`);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('--- Benchmarking Promise.all ---');
  }
  let startOptimized = performance.now();
  for (let it = 0; it < iterations; it++) {
    await Promise.all(Object.keys(entries).map(async (key) => {
      const val = entries[key];
      if (val === undefined) {
        try { await store.delete(key); } catch { /* intentionally empty */ }
      } else {
        await store.set(key, val);
      }
    }));
    await store.save();
  }
  let endOptimized = performance.now();
  if (process.env.NODE_ENV === 'development') {
    console.log(`Optimized Time: ${(endOptimized - startOptimized).toFixed(2)}ms`);
  }
}

runBenchmark();
