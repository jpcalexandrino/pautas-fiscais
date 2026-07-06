import db from '../config/db';
import { QueryResult } from 'pg';

export interface TermoRow {
  sk_termo?: number;
  termo: string;
  tipo?: string;
  created_at?: Date;
}

const DEFAULT_TERMS = [
  'imperio',
  'império',
  'cidade imperial',
  'puro malte pilsen',
  'macedonia',
  'macedônia',
  '3.0'
];

class TermoRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS config_termos (
        sk_termo SERIAL PRIMARY KEY,
        termo VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'proprio',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT config_termos_termo_tipo_unique UNIQUE (termo, tipo)
      );
    `;
    await db.query(queryText);

    // Migração para tabelas existentes
    await db.query(`
      ALTER TABLE config_termos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) NOT NULL DEFAULT 'proprio';
    `).catch(() => {});

    try {
      await db.query(`ALTER TABLE config_termos DROP CONSTRAINT IF EXISTS config_termos_termo_key;`);
      await db.query(`
        ALTER TABLE config_termos ADD CONSTRAINT config_termos_termo_tipo_unique UNIQUE (termo, tipo);
      `).catch(() => {});
    } catch (e) {
      console.error('Erro ao ajustar constraints de config_termos:', e);
    }

    return db.query('SELECT 1');
  }

  async seed(): Promise<void> {
    const check = await db.query('SELECT COUNT(*) FROM config_termos');
    const count = parseInt(check.rows[0].count, 10);
    if (count === 0) {
      for (const t of DEFAULT_TERMS) {
        await db.query(
          `INSERT INTO config_termos (termo, tipo) VALUES ($1, $2) ON CONFLICT (termo, tipo) DO NOTHING`,
          [t, 'proprio']
        );
      }
    }
  }

  async getAll(tipo?: string): Promise<QueryResult> {
    if (tipo) {
      return db.query('SELECT * FROM config_termos WHERE tipo = $1 ORDER BY termo ASC', [tipo]);
    }
    return db.query('SELECT * FROM config_termos ORDER BY termo ASC');
  }

  async create(termo: string, tipo: string = 'proprio'): Promise<QueryResult> {
    return db.query(
      'INSERT INTO config_termos (termo, tipo) VALUES ($1, $2) RETURNING *',
      [termo.trim(), tipo]
    );
  }

  async delete(id: number | string): Promise<QueryResult> {
    return db.query('DELETE FROM config_termos WHERE sk_termo = $1 RETURNING *', [id]);
  }
}

export default new TermoRepository();
