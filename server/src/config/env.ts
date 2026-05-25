import dotenv from 'dotenv';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Em produção, tenta carregar do arquivo .env.production se existir,
  // ou confia nas variáveis de ambiente fornecidas pelo host/Lightsail.
  dotenv.config({ path: path.join(__dirname, '../../.env.production') });
} else {
  // Em desenvolvimento, carrega as variáveis do .env.development
  dotenv.config({ path: path.join(__dirname, '../../.env.development') });
}
