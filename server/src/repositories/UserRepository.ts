import db from '../config/db';
import bcrypt from 'bcryptjs';
import { QueryResult } from 'pg';

export interface UserRow {
  sk_usuario?: number;
  nome: string;
  email: string;
  senha_hash?: string;
  perfil?: string;
  ativo?: boolean;
}

class UserRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS dim_usuarios (
        sk_usuario SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        perfil TEXT DEFAULT 'user',
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }


  async findByEmail(email: string): Promise<UserRow | null> {
    const result = await db.query('SELECT * FROM dim_usuarios WHERE email = $1', [email]);
    return (result.rows[0] as UserRow) || null;
  }

  async findById(id: string | number): Promise<UserRow | null> {
    const result = await db.query('SELECT sk_usuario, nome, email, perfil, ativo, criado_em FROM dim_usuarios WHERE sk_usuario = $1', [id]);
    return (result.rows[0] as UserRow) || null;
  }

  async findByIdWithPassword(id: string | number): Promise<UserRow | null> {
    const result = await db.query('SELECT * FROM dim_usuarios WHERE sk_usuario = $1', [id]);
    return (result.rows[0] as UserRow) || null;
  }

  async getAll(): Promise<QueryResult> {
    return db.query('SELECT sk_usuario, nome, email, perfil, ativo, criado_em FROM dim_usuarios ORDER BY nome ASC');
  }

  async create(user: UserRow): Promise<QueryResult> {
    const { nome, email, senha_hash, perfil } = user;
    const hashedPassword = await bcrypt.hash(senha_hash!, 10);
    const queryText = `
      INSERT INTO dim_usuarios (nome, email, senha_hash, perfil)
      VALUES ($1, $2, $3, $4)
      RETURNING sk_usuario, nome, email, perfil, ativo, criado_em;
    `;
    return db.query(queryText, [nome, email, hashedPassword, perfil || 'user']);
  }

  async update(id: string | number, user: UserRow): Promise<QueryResult> {
    const { nome, email, perfil, ativo } = user;
    const queryText = `
      UPDATE dim_usuarios
      SET nome = $1, email = $2, perfil = $3, ativo = $4
      WHERE sk_usuario = $5
      RETURNING sk_usuario, nome, email, perfil, ativo, criado_em;
    `;
    return db.query(queryText, [nome, email, perfil, ativo, id]);
  }

  async updatePassword(id: string | number, newPassword: string): Promise<QueryResult> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return db.query('UPDATE dim_usuarios SET senha_hash = $1 WHERE sk_usuario = $2', [hashedPassword, id]);
  }

  async delete(id: string | number): Promise<QueryResult> {
    return db.query('DELETE FROM dim_usuarios WHERE sk_usuario = $1', [id]);
  }
}

export default new UserRepository();
