import { config } from '../../config.js';

let store = null;

export async function initStore(options = {}) {
  const engine = config.storageEngine;
  if (['prisma', 'supabase', 'postgres', 'postgresql', 'mysql'].includes(engine)) {
    const { initPrismaStore } = await import('./prisma.js');
    store = await initPrismaStore();
  } else {
    const { createMemoryStore } = await import('./memory.js');
    const memoryStore = createMemoryStore({ seed: options.seed ?? true, dataFile: options.dataFile ?? (config.dataFile || '') });
    const demoUser = await memoryStore.userFindByEmail('dev@cuttrack.app');
    if (demoUser && demoUser.passwordHash === 'SEED_PENDING') {
      const { hashPassword } = await import('../password.js');
      demoUser.passwordHash = await hashPassword('Password123!');
    }
    store = memoryStore;
  }
  return store;
}

export function resetStore() {
  store = null;
}

export function getStore() {
  if (!store) throw new Error('Database store not initialized. Call initStore() first.');
  return store;
}
