import dotenv from 'dotenv';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Em produção, tenta carregar do arquivo .env.production primeiro
  // e depois do .env genérico, caso exista.
  dotenv.config({ path: path.join(__dirname, '../../.env.production') });
  dotenv.config({ path: path.join(__dirname, '../../.env') });
} else {
  // Em desenvolvimento, carrega as variáveis do .env.development
  dotenv.config({ path: path.join(__dirname, '../../.env.development') });
}

// VALIDAÇÃO DAS VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS
const requiredEnv = [
  'JWT_SECRET',
  'SYNAPSE_API_URL',
  'SYNAPSE_API_KEY_TEXTRACT',
];

const missingEnv = requiredEnv.filter((key) => !process.env[key]);

// O banco de dados pode ser configurado por DATABASE_URL ou variáveis individuais
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

