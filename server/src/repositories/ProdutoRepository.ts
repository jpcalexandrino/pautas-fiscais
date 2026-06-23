import db from '../config/db';
import { QueryResult } from 'pg';
import { normalizeGtin } from '../utils/normalize';

export interface ProdutoRow {
  sk_produto?: number;
  nk_codigo_interno?: string;
  gtin_13?: string;
  descricao_interna: string;
  embalagem?: string;
  conteudo_volume?: number;
}

class ProdutoRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS dim_produto (
        sk_produto SERIAL PRIMARY KEY,
        nk_codigo_interno VARCHAR(50),
        gtin_13 VARCHAR(13) UNIQUE,
        descricao_interna VARCHAR(255) NOT NULL,
        embalagem VARCHAR(50),
        conteudo_volume INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }

  async getAll(): Promise<QueryResult> {
    return db.query('SELECT * FROM dim_produto ORDER BY descricao_interna ASC');
  }

  async getById(id: number): Promise<QueryResult> {
    return db.query('SELECT * FROM dim_produto WHERE sk_produto = $1', [id]);
  }

  async findByGtin(gtin: string): Promise<QueryResult> {
    const normalized = normalizeGtin(gtin);
    if (!normalized) {
      return db.query('SELECT * FROM dim_produto WHERE false');
    }
    return db.query(
      `SELECT * FROM dim_produto WHERE regexp_replace(gtin_13, '[^0-9]', '', 'g') = $1`,
      [normalized]
    );
  }

  async findByGtinExcludingId(id: number, gtin: string): Promise<QueryResult> {
    const normalized = normalizeGtin(gtin);
    if (!normalized) {
      return db.query('SELECT * FROM dim_produto WHERE false');
    }
    return db.query(
      `SELECT * FROM dim_produto
       WHERE sk_produto <> $1 AND regexp_replace(gtin_13, '[^0-9]', '', 'g') = $2`,
      [id, normalized]
    );
  }

  async findByCodigoInterno(codigo: string): Promise<QueryResult> {
    if (!codigo) {
      return db.query('SELECT * FROM dim_produto WHERE false');
    }
    return db.query('SELECT * FROM dim_produto WHERE nk_codigo_interno = $1', [codigo]);
  }

  async findByDescricaoInterna(descricao: string): Promise<QueryResult> {
    if (!descricao) {
      return db.query('SELECT * FROM dim_produto WHERE false');
    }
    return db.query('SELECT * FROM dim_produto WHERE LOWER(descricao_interna) = LOWER($1)', [descricao.trim()]);
  }

  async create(produto: ProdutoRow): Promise<QueryResult> {
    const { nk_codigo_interno, gtin_13, descricao_interna, embalagem, conteudo_volume } = produto;
    return db.query(
      `INSERT INTO dim_produto (nk_codigo_interno, gtin_13, descricao_interna, embalagem, conteudo_volume)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nk_codigo_interno || null, gtin_13 || null, descricao_interna, embalagem || null, conteudo_volume ?? null]
    );
  }

  async update(id: number, produto: ProdutoRow): Promise<QueryResult> {
    const { nk_codigo_interno, gtin_13, descricao_interna, embalagem, conteudo_volume } = produto;
    return db.query(
      `UPDATE dim_produto
       SET nk_codigo_interno = $1, gtin_13 = $2, descricao_interna = $3,
           embalagem = $4, conteudo_volume = $5
       WHERE sk_produto = $6 RETURNING *`,
      [nk_codigo_interno || null, gtin_13 || null, descricao_interna, embalagem || null, conteudo_volume ?? null, id]
    );
  }

  async delete(id: number): Promise<QueryResult> {
    return db.query('DELETE FROM dim_produto WHERE sk_produto = $1', [id]);
  }
}

export default new ProdutoRepository();
