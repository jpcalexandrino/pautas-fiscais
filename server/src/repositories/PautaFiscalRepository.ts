import db from '../config/db';
import { QueryResult } from 'pg';

export interface PautaFiscalRow {
  sk_pauta?: number;
  fk_produto: number;
  fk_estado: number;
  fk_data?: number | null;
  valor_pauta?: number | null;
  status?: string;
  arquivo_origem?: string | null;
}

export interface PautaPendenteRow {
  id?: number;
  fk_estado: number;
  fk_estado_nk: string;
  descricao_estado: string;
  gtin_extraido?: string | null;
  valor_pauta?: number | null;
  fk_data?: number | null;
  arquivo_origem?: string | null;
  dados_extraidos?: Record<string, unknown>;
}

class PautaFiscalRepository {
  async createTable(): Promise<QueryResult> {
    await db.query(`
      CREATE TABLE IF NOT EXISTS fato_pauta_fiscal (
        sk_pauta BIGSERIAL PRIMARY KEY,
        fk_produto INT NOT NULL REFERENCES dim_produto(sk_produto),
        fk_estado INT NOT NULL REFERENCES dim_estado(sk_estado),
        fk_data INT REFERENCES dim_calendario(sk_data),
        valor_pauta DECIMAL(10,4),
        status VARCHAR(20) DEFAULT 'confirmado',
        arquivo_origem VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS fato_pauta_pendente (
        id BIGSERIAL PRIMARY KEY,
        fk_estado INT NOT NULL REFERENCES dim_estado(sk_estado),
        fk_estado_nk CHAR(2) NOT NULL,
        descricao_estado VARCHAR(500) NOT NULL,
        gtin_extraido VARCHAR(13),
        valor_pauta DECIMAL(10,4),
        fk_data INT REFERENCES dim_calendario(sk_data),
        arquivo_origem VARCHAR(500),
        dados_extraidos JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return db.query(`
      CREATE TABLE IF NOT EXISTS pauta_arquivo_ocr (
        id BIGSERIAL PRIMARY KEY,
        filename VARCHAR(500) NOT NULL UNIQUE,
        uf CHAR(2) NOT NULL,
        textract_json JSONB NOT NULL,
        ai_json JSONB,
        data_pauta DATE,
        confirmed_cells JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async getAll(filters?: { fk_estado?: number; fk_produto?: number }): Promise<QueryResult> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters?.fk_estado) {
      values.push(filters.fk_estado);
      conditions.push(`f.fk_estado = $${values.length}`);
    }
    if (filters?.fk_produto) {
      values.push(filters.fk_produto);
      conditions.push(`f.fk_produto = $${values.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return db.query(
      `SELECT f.*,
              p.descricao_interna, p.gtin_13, p.nk_codigo_interno, p.embalagem, p.conteudo_volume,
              e.nk_uf, e.nome_estado,
              c.data_completa AS data
       FROM fato_pauta_fiscal f
       JOIN dim_produto p ON p.sk_produto = f.fk_produto
       JOIN dim_estado e ON e.sk_estado = f.fk_estado
       LEFT JOIN dim_calendario c ON c.sk_data = f.fk_data
       ${where}
       ORDER BY f.created_at DESC`,
      values
    );
  }

  async create(row: PautaFiscalRow): Promise<QueryResult> {
    return db.query(
      `INSERT INTO fato_pauta_fiscal (
        fk_produto, fk_estado, fk_data,
        valor_pauta, status, arquivo_origem
      ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        row.fk_produto, row.fk_estado, row.fk_data ?? null,
        row.valor_pauta ?? null, row.status || 'confirmado', row.arquivo_origem ?? null,
      ]
    );
  }

  async createMany(rows: PautaFiscalRow[]): Promise<QueryResult> {
    if (rows.length === 0) return { rows: [], command: '', rowCount: 0, oid: 0, fields: [] } as QueryResult;

    const values: any[] = [];
    const placeholders: string[] = [];

    rows.forEach((row, i) => {
      const idx = i * 6;
      placeholders.push(`($${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6})`);
      values.push(
        row.fk_produto,
        row.fk_estado,
        row.fk_data ?? null,
        row.valor_pauta ?? null,
        row.status || 'confirmado',
        row.arquivo_origem ?? null
      );
    });

    return db.query(
      `INSERT INTO fato_pauta_fiscal (
        fk_produto, fk_estado, fk_data, valor_pauta, status, arquivo_origem
      ) VALUES ${placeholders.join(',')} RETURNING *`,
      values
    );
  }

  async createPendente(row: PautaPendenteRow): Promise<QueryResult> {
    return db.query(
      `INSERT INTO fato_pauta_pendente (
        fk_estado, fk_estado_nk, descricao_estado, gtin_extraido,
        valor_pauta, fk_data, arquivo_origem, dados_extraidos
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        row.fk_estado, row.fk_estado_nk, row.descricao_estado, row.gtin_extraido ?? null,
        row.valor_pauta ?? null, row.fk_data ?? null,
        row.arquivo_origem ?? null, row.dados_extraidos ? JSON.stringify(row.dados_extraidos) : null,
      ]
    );
  }

  async createPendentesMany(rows: PautaPendenteRow[]): Promise<QueryResult> {
    if (rows.length === 0) return { rows: [], command: '', rowCount: 0, oid: 0, fields: [] } as QueryResult;

    const values: any[] = [];
    const placeholders: string[] = [];

    rows.forEach((row, i) => {
      const idx = i * 8;
      placeholders.push(`($${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6},$${idx + 7},$${idx + 8})`);
      values.push(
        row.fk_estado,
        row.fk_estado_nk,
        row.descricao_estado,
        row.gtin_extraido ?? null,
        row.valor_pauta ?? null,
        row.fk_data ?? null,
        row.arquivo_origem ?? null,
        row.dados_extraidos ? JSON.stringify(row.dados_extraidos) : null
      );
    });

    return db.query(
      `INSERT INTO fato_pauta_pendente (
        fk_estado, fk_estado_nk, descricao_estado, gtin_extraido,
        valor_pauta, fk_data, arquivo_origem, dados_extraidos
      ) VALUES ${placeholders.join(',')} RETURNING *`,
      values
    );
  }

  async getPendentes(fk_estado_nk?: string): Promise<QueryResult> {
    if (fk_estado_nk) {
      return db.query(
        `SELECT p.*, e.nome_estado
         FROM fato_pauta_pendente p
         JOIN dim_estado e ON e.sk_estado = p.fk_estado
         WHERE p.fk_estado_nk = $1
         ORDER BY p.created_at DESC`,
        [fk_estado_nk.toUpperCase()]
      );
    }
    return db.query(
      `SELECT p.*, e.nome_estado
       FROM fato_pauta_pendente p
       JOIN dim_estado e ON e.sk_estado = p.fk_estado
       ORDER BY p.created_at DESC`
    );
  }

  async getPendenteById(id: number): Promise<QueryResult> {
    return db.query('SELECT * FROM fato_pauta_pendente WHERE id = $1', [id]);
  }

  async deletePendente(id: number): Promise<QueryResult> {
    return db.query('DELETE FROM fato_pauta_pendente WHERE id = $1', [id]);
  }

  async findOcrByFilename(filename: string): Promise<QueryResult> {
    return db.query('SELECT * FROM pauta_arquivo_ocr WHERE filename = $1', [filename]);
  }

  async upsertOcr(filename: string, uf: string, textractJson: any, aiJson?: any, dataPauta?: string): Promise<QueryResult> {
    return db.query(
      `INSERT INTO pauta_arquivo_ocr (filename, uf, textract_json, ai_json, data_pauta, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (filename) DO UPDATE SET
         uf = EXCLUDED.uf,
         textract_json = EXCLUDED.textract_json,
         ai_json = EXCLUDED.ai_json,
         data_pauta = COALESCE(EXCLUDED.data_pauta, pauta_arquivo_ocr.data_pauta),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        filename,
        uf.toUpperCase(),
        JSON.stringify(textractJson),
        aiJson ? JSON.stringify(aiJson) : null,
        dataPauta || null
      ]
    );
  }

  async addConfirmedCell(filename: string, cellKey: string): Promise<QueryResult> {
    return db.query(
      `UPDATE pauta_arquivo_ocr
       SET confirmed_cells = COALESCE(confirmed_cells, '[]'::jsonb) || jsonb_build_array($2::text),
           updated_at = CURRENT_TIMESTAMP
       WHERE filename = $1`,
      [filename, cellKey]
    );
  }

  async updateOcrTables(filename: string, textractJson: any): Promise<QueryResult> {
    return db.query(
      `UPDATE pauta_arquivo_ocr
       SET textract_json = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE filename = $1`,
      [filename, JSON.stringify(textractJson)]
    );
  }

  async deleteFiscalAndPendenteByFilename(filename: string): Promise<void> {
    await db.query('DELETE FROM fato_pauta_fiscal WHERE arquivo_origem = $1', [filename]);
    await db.query('DELETE FROM fato_pauta_pendente WHERE arquivo_origem = $1', [filename]);
  }

  async getOcrFiles(): Promise<QueryResult> {
    return db.query('SELECT id, filename, uf, data_pauta, confirmed_cells, textract_json, created_at FROM pauta_arquivo_ocr ORDER BY created_at DESC');
  }

  async deleteAllPendentes(): Promise<QueryResult> {
    return db.query('DELETE FROM fato_pauta_pendente');
  }
}

export default new PautaFiscalRepository();
