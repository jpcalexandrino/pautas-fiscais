import dotenv from 'dotenv';
import path from 'path';

/**
 * APP_ENV: development | homologation | production
 * NODE_ENV continua sendo usado por libs (pg ssl, etc.)
 */
const appEnv = process.env.APP_ENV || process.env.NODE_ENV || 'development';

const envFiles: Record<string, string[]> = {
  production: ['.env.production', '.env'],
  homologation: ['.env.homologation', '.env.homolog', '.env'],
  development: ['.env.development', '.env'],
};

const files = envFiles[appEnv] || envFiles.development;
const serverRoot = path.join(__dirname, '../..');

for (const file of files) {
  dotenv.config({ path: path.join(serverRoot, file) });
}

if (!process.env.APP_ENV) {
  process.env.APP_ENV = appEnv;
}

const requiredEnv = [
  'JWT_SECRET',
  'SYNAPSE_API_URL',
  'SYNAPSE_API_KEY_TEXTRACT',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

const hasDatabaseConfig = !!(
  process.env.DATABASE_URL ||
  (process.env.DB_USER && process.env.DB_HOST && process.env.DB_NAME && process.env.DB_PASSWORD)
);

if (!hasDatabaseConfig) {
  missingEnv.push('DATABASE_URL (ou DB_USER, DB_HOST, DB_NAME, DB_PASSWORD)');
}

if (missingEnv.length > 0) {
  console.error('\x1b[31m%s\x1b[0m', 'Erro de inicialização do Servidor. Variáveis de ambiente ausentes no .env:');
  missingEnv.forEach((key) => console.error('\x1b[31m%s\x1b[0m', `   - ${key}`));
  process.exit(1);
}
