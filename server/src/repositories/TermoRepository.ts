import db from '../config/db';
import { QueryResult } from 'pg';

export interface TermoRow {
  sk_termo?: number;
  termo: string;
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
        termo VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }

  async seed(): Promise<void> {
    const check = await db.query('SELECT COUNT(*) FROM config_termos');
    const count = parseInt(check.rows[0].count, 10);
    if (count === 0) {
      for (const t of DEFAULT_TERMS) {
        await db.query(
          `INSERT INTO config_termos (termo) VALUES ($1) ON CONFLICT (termo) DO NOTHING`,
          [t]
        );
      }
    }
  }

  async getAll(): Promise<QueryResult> {
    return db.query('SELECT * FROM config_termos ORDER BY termo ASC');
  }

  async create(termo: string): Promise<QueryResult> {
    return db.query(
      'INSERT INTO config_termos (termo) VALUES ($1) RETURNING *',
      [termo.trim()]
    );
  }

  async delete(id: number | string): Promise<QueryResult> {
    return db.query('DELETE FROM config_termos WHERE sk_termo = $1 RETURNING *', [id]);
  }
}

export default new TermoRepository();
