import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createExpressApi } from './src/server/app';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // REST API router
  app.use('/api', createExpressApi());

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VK NETWORK SIMULATOR server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start VK Network Simulator server:', err);
  process.exit(1);
});
