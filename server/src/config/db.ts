import { Pool, QueryResult } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number.parseInt(process.env.DB_PORT || '5432', 10),
});

export const query = (text: string, params?: any[]): Promise<QueryResult> => pool.query(text, params);
export { pool };

export default {
  query,
  pool,
};
