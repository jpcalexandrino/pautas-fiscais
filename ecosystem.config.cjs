/**
 * PM2 — Pricer
 *
 * Homologação (Lightsail):
 *   APP_ENV=homologation pm2 start ecosystem.config.cjs --only pricer-homolog
 *
 * Produção:
 *   APP_ENV=production pm2 start ecosystem.config.cjs --only pricer
 *
 * O nginx deve servir o SPA (client/dist) e fazer proxy de /api → Node.
 * Defina SERVE_CLIENT=false nos .env de homolog/prod quando o nginx servir o frontend.
 */
module.exports = {
  apps: [
    {
      name: 'pricer-homolog',
      script: './server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'homologation',
        PORT: 3001,
        SERVE_CLIENT: 'false',
      },
    },
    {
      name: 'pricer',
      script: './server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
        PORT: 3001,
        SERVE_CLIENT: 'false',
      },
    },
  ],
};
