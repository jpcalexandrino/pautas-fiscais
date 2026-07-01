import db from '../config/db';
import { QueryResult } from 'pg';

export interface AuditLog {
  id?: number;
  fk_usuario?: number | null;
  nome_usuario?: string | null;
  acao: string;
  detalhes: Record<string, any>;
  created_at?: Date;
}

class AuditRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS log_auditoria (
        id SERIAL PRIMARY KEY,
        fk_usuario INT REFERENCES dim_usuarios(sk_usuario) ON DELETE SET NULL,
        nome_usuario VARCHAR(255),
        acao VARCHAR(100) NOT NULL,
        detalhes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }

  async getAll(): Promise<QueryResult> {
    return db.query(`
      SELECT l.*, u.nome as user_name, u.email as user_email
      FROM log_auditoria l
      LEFT JOIN dim_usuarios u ON u.sk_usuario = l.fk_usuario
      ORDER BY l.created_at DESC
    `);
  }

  async log(userId: number | string | undefined, action: string, details: Record<string, any>): Promise<QueryResult> {
    let userName: string | null = null;
    let uId: number | null = null;

    if (userId) {
      uId = Number(userId);
      try {
        const userRes = await db.query('SELECT nome FROM dim_usuarios WHERE sk_usuario = $1', [uId]);
        if (userRes.rows.length > 0) {
          userName = userRes.rows[0].nome;
        }
      } catch (err) {
        console.error('Erro ao buscar usuário para log:', err);
      }
    }

    return db.query(
      `INSERT INTO log_auditoria (fk_usuario, nome_usuario, acao, detalhes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [uId, userName, action, JSON.stringify(details)]
    );
  }
}

export default new AuditRepository();
