import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url('VITE_API_URL deve ser uma URL válida'),
});

const result = envSchema.safeParse(import.meta.env);

if (!result.success) {
  console.error('Erros de validação do .env:', result.error.format());
  throw new Error('Configuração do arquivo .env inválida');
}

export const env = result.data;
