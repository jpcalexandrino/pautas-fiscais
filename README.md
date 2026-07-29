# Pricer

Monorepo com frontend e API separados, prontos para extrair em repositórios independentes.

```
CLIENT/
├── client/                 # @pricer/client — Vite/React
├── server/                 # @pricer/server — Express/API
│   ├── src/
│   │   ├── app/            # createApp + registerRoutes
│   │   ├── bootstrap/      # initDatabase
│   │   ├── config/         # env, db
│   │   ├── modules/        # domínios (auth, users, produtos, pautas, …)
│   │   ├── infrastructure/ # OCR (Textract) + PDF
│   │   └── shared/         # middleware, utils
│   └── .env.*
├── deploy/                 # nginx (exemplos)
├── scripts/                # deploy-homolog.sh
├── ecosystem.config.cjs    # PM2 (homolog + prod)
└── package.json
```

## Desenvolvimento local

```bash
npm run dev:server
npm run dev:client
```

## Homologação (Lightsail + PM2 + nginx)

1. Na VM, clone/pull o repo (ex.: `/var/www/pricer`).
2. Crie envs:
   - `server/.env.homologation` (a partir de `server/.env.homologation.example`)
   - `client/.env.homologation` com `VITE_API_URL=/api`
3. Configure nginx com `deploy/nginx.homolog.conf.example` (`root` → `client/dist`, `/api` → `127.0.0.1:3001`).
4. Deploy:

```bash
bash scripts/deploy-homolog.sh
# ou manualmente:
npm run build:all
APP_ENV=homologation pm2 start ecosystem.config.cjs --only pricer-homolog
```

Variáveis importantes no server:

| Variável | Homolog |
|----------|---------|
| `APP_ENV` | `homologation` |
| `SERVE_CLIENT` | `false` (nginx serve o SPA) |
| `CORS_ORIGIN` | URL pública da homolog |
| `PORT` | `3001` (só localhost; nginx faz proxy) |

## Produção

Mesmo fluxo, app PM2 `pricer` e `server/.env.production`.

```bash
npm run build:all
pm2 start ecosystem.config.cjs --only pricer
```

## Separação futura client / API

1. Extrair `client/` e `server/` em repos.
2. Manter nginx: static do client + proxy `/api`.
3. `CORS_ORIGIN` + `VITE_API_URL` absolutos se forem hosts diferentes.
