import { config } from './config.js';
import { initStore } from './lib/db/index.js';
import { createApp } from './app.js';

async function main() {
  try {
    await initStore();
  } catch (error) {
    console.error(`\n[cut-track] Failed to start: ${error.message}`);
    console.error(`[cut-track] Currently using STORAGE_ENGINE=${config.storageEngine}. Set STORAGE_ENGINE=memory to run without a database.\n`);
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`[cut-track] API running on http://0.0.0.0:${config.port} (engine: ${config.storageEngine})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[cut-track] Port ${config.port} is already in use by another process.`);
      console.error(`[cut-track] Run this command in PowerShell to free it:`);
      console.error(`            Get-Process -Id (Get-NetTCPConnection -LocalPort ${config.port}).OwningProcess | Stop-Process -Force\n`);
      process.exit(1);
    } else {
      console.error('[cut-track] Server error:', err);
    }
  });

  const shutdown = async () => {
    server.close(async () => {
      try {
        const { getStore } = await import('./lib/db/index.js');
        await getStore().disconnect();
      } catch {
        // store already gone
      }
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
