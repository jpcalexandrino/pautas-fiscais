import express, { type Application } from 'express';
import cors from 'cors';
import path from 'path';
import { registerRoutes } from './registerRoutes';

function isDeployedEnv(): boolean {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV;
  return appEnv === 'production' || appEnv === 'homologation' || process.env.NODE_ENV === 'production';
}

/**
 * Cria a aplicação Express (sem listen).
 * Em homolog/prod o nginx costuma servir o SPA; use SERVE_CLIENT=true só se o Node for servir o static.
 */
export function createApp(): Application {
  const app = express();
  app.disable('x-powered-by');

  const deployed = isDeployedEnv();

  app.use(
    cors(
      deployed
        ? { origin: process.env.CORS_ORIGIN || false }
        : { origin: true },
    ),
  );
  app.use(express.json({ limit: '10mb' }));

  registerRoutes(app);

  const serveClient = process.env.SERVE_CLIENT === 'true' ||
    (deployed && process.env.SERVE_CLIENT !== 'false');

  if (serveClient) {
    const clientDistPath = path.join(__dirname, '../../../client/dist');
    app.use(express.static(clientDistPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  return app;
}
