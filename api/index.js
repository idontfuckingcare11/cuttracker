import { createApp } from '../server/src/app.js';
import { initStore } from '../server/src/lib/db/index.js';

let isInit = false;
const app = createApp();

export default async function handler(req, res) {
  if (!isInit) {
    try {
      await initStore();
    } catch (e) {
      console.error('[vercel-api] Store init error:', e);
    }
    isInit = true;
  }
  return app(req, res);
}
