import { Pool, QueryResult } from 'pg';


const isProduction = process.env.NODE_ENV === 'production';

const pool = process.env.DATABASE_URL
  ? new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  })
  : new Pool({
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
