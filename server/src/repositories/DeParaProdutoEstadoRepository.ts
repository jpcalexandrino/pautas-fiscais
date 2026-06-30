import db from '../config/db';
import { QueryResult } from 'pg';
import { normalizeGtin, normalizeText } from '../utils/normalize';

export interface DeParaRow {
  id?: number;
  fk_estado_nk: string;
  termo_descricao_estado: string;
  gtin_estado?: string | null;
  fk_produto_sk: number;
}

class DeParaProdutoEstadoRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS aux_de_para_produto_estado (
        id SERIAL PRIMARY KEY,
        fk_estado_nk CHAR(2) NOT NULL REFERENCES dim_estado(nk_uf),
        termo_descricao_estado VARCHAR(500) NOT NULL,
        gtin_estado VARCHAR(13),
        fk_produto_sk INT NOT NULL REFERENCES dim_produto(sk_produto),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (termo_descricao_estado, fk_produto_sk)
      );
    `;
    return db.query(queryText);
  }

  async getAll(fk_estado_nk?: string): Promise<QueryResult> {
    if (fk_estado_nk) {
      return db.query(
        `SELECT d.*, p.descricao_interna, p.gtin_13, p.nk_codigo_interno, e.nome_estado
         FROM aux_de_para_produto_estado d
         JOIN dim_produto p ON p.sk_produto = d.fk_produto_sk
         JOIN dim_estado e ON e.nk_uf = d.fk_estado_nk
         WHERE d.fk_estado_nk = $1
         ORDER BY d.termo_descricao_estado ASC`,
        [fk_estado_nk.toUpperCase()]
      );
    }
    return db.query(
      `SELECT d.*, p.descricao_interna, p.gtin_13, p.nk_codigo_interno, e.nome_estado
       FROM aux_de_para_produto_estado d
       JOIN dim_produto p ON p.sk_produto = d.fk_produto_sk
       JOIN dim_estado e ON e.nk_uf = d.fk_estado_nk
       ORDER BY e.nome_estado ASC, d.termo_descricao_estado ASC`
    );
  }

  async getById(id: number): Promise<QueryResult> {
    return db.query(
      `SELECT d.*, p.descricao_interna, p.gtin_13, p.nk_codigo_interno, e.nome_estado
       FROM aux_de_para_produto_estado d
       JOIN dim_produto p ON p.sk_produto = d.fk_produto_sk
       JOIN dim_estado e ON e.nk_uf = d.fk_estado_nk
       WHERE d.id = $1`,
      [id]
    );
  }

  async findByTermo(fk_estado_nk: string, termo: string): Promise<QueryResult> {
    const normalized = normalizeText(termo);
    const all = await this.getAll(fk_estado_nk);
    const match = all.rows.find(
      (row: { termo_descricao_estado: string }) =>
        normalizeText(row.termo_descricao_estado) === normalized
    );
    return { rows: match ? [match] : [], rowCount: match ? 1 : 0 } as QueryResult;
  }

  async findByGtinEstado(fk_estado_nk: string, gtin: string): Promise<QueryResult> {
    const normalized = normalizeGtin(gtin);
    if (!normalized) {
      return db.query('SELECT * FROM aux_de_para_produto_estado WHERE false');
    }
    return db.query(
      `SELECT d.*, p.descricao_interna, p.gtin_13
       FROM aux_de_para_produto_estado d
       JOIN dim_produto p ON p.sk_produto = d.fk_produto_sk
       WHERE d.fk_estado_nk = $1
         AND regexp_replace(d.gtin_estado, '[^0-9]', '', 'g') = $2`,
      [fk_estado_nk.toUpperCase(), normalized]
    );
  }

  async create(row: DeParaRow): Promise<QueryResult> {
    const existing = await db.query(
      `SELECT * FROM aux_de_para_produto_estado 
       WHERE fk_estado_nk = $1 AND termo_descricao_estado = $2 AND fk_produto_sk = $3`,
      [row.fk_estado_nk.toUpperCase(), row.termo_descricao_estado, row.fk_produto_sk]
    );
    
    if (existing.rows.length > 0) {
      return existing;
    }

    return db.query(
      `INSERT INTO aux_de_para_produto_estado (fk_estado_nk, termo_descricao_estado, gtin_estado, fk_produto_sk)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [row.fk_estado_nk.toUpperCase(), row.termo_descricao_estado, row.gtin_estado || null, row.fk_produto_sk]
    );
  }

  async update(id: number, row: DeParaRow): Promise<QueryResult> {
    return db.query(
      `UPDATE aux_de_para_produto_estado
       SET fk_estado_nk = $1, termo_descricao_estado = $2, gtin_estado = $3, fk_produto_sk = $4
       WHERE id = $5 RETURNING *`,
      [row.fk_estado_nk.toUpperCase(), row.termo_descricao_estado, row.gtin_estado || null, row.fk_produto_sk, id]
    );
  }

  async delete(id: number): Promise<QueryResult> {
    return db.query('DELETE FROM aux_de_para_produto_estado WHERE id = $1', [id]);
  }
}

export default new DeParaProdutoEstadoRepository();
