import db from '../config/db';
import bcrypt from 'bcryptjs';
import { QueryResult } from 'pg';

export interface UserRow {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role?: string;
  active?: boolean;
}

class UserRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }


  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return (result.rows[0] as UserRow) || null;
  }

  async findById(id: string | number): Promise<UserRow | null> {
    const result = await db.query('SELECT id, name, email, role, active, created_at FROM users WHERE id = $1', [id]);
    return (result.rows[0] as UserRow) || null;
  }

  async findByIdWithPassword(id: string | number): Promise<UserRow | null> {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return (result.rows[0] as UserRow) || null;
  }

  async getAll(): Promise<QueryResult> {
    return db.query('SELECT id, name, email, role, active, created_at FROM users ORDER BY name ASC');
  }

  async create(user: UserRow): Promise<QueryResult> {
    const { name, email, password, role } = user;
    const hashedPassword = await bcrypt.hash(password!, 10);
    const queryText = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, active, created_at;
    `;
    return db.query(queryText, [name, email, hashedPassword, role || 'user']);
  }

  async update(id: string | number, user: UserRow): Promise<QueryResult> {
    const { name, email, role, active } = user;
    const queryText = `
      UPDATE users
      SET name = $1, email = $2, role = $3, active = $4
      WHERE id = $5
      RETURNING id, name, email, role, active, created_at;
    `;
    return db.query(queryText, [name, email, role, active, id]);
  }

  async updatePassword(id: string | number, newPassword: string): Promise<QueryResult> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
  }

  async delete(id: string | number): Promise<QueryResult> {
    return db.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

export default new UserRepository();
