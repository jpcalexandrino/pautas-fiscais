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
