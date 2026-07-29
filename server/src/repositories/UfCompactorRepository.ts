import db from '../config/db';
import { QueryResult } from 'pg';

export interface UfCompactorConfigRow {
  uf: string;
  header_mappings: {
    codigo?: string[];
    descricao?: string[];
    embalagem?: string[];
    volume?: string[];
    preco?: string[];
  };
  features: {
    split_2_columns?: boolean;
    parallel_tables_split?: boolean;
    matrix_header?: boolean;
    subheaders?: boolean;
    ignore_noise?: boolean;
  };
  updated_at?: Date;
  updated_by?: string;
}

const DEFAULT_CONFIGS: Record<string, Partial<UfCompactorConfigRow>> = {
  PR: {
    header_mappings: {
      codigo: ['CODIGO', 'CÓDIGO', 'NCM', 'ITEM', 'CHAVE'],
      descricao: ['MARCA_PRODUTO', 'MARCA', 'PRODUTO', 'DESCRICAO', 'DESCRIÇÃO'],
      embalagem: ['EMBALAGEM', 'RECIPIENTE', 'TIPO'],
      volume: ['VOLUME', 'CAPACIDADE', 'CONTEUDO', 'CONTEÚDO'],
      preco: ['PMPF', 'PRECO', 'PREÇO', 'VALOR', 'PAUTA', 'CUSTO']
    },
    features: {
      split_2_columns: false,
      parallel_tables_split: false,
      matrix_header: true,
      subheaders: false,
      ignore_noise: true
    }
  },
  SE: {
    header_mappings: {
      codigo: ['CODIGO', 'CÓDIGO', 'NCM', 'ITEM'],
      descricao: ['PRODUTO', 'MARCA', 'DESCRICAO', 'DESCRIÇÃO'],
      embalagem: ['EMBALAGEM', 'RECIPIENTE'],
      volume: ['VOLUME', 'CAPACIDADE', 'CONTEUDO', 'CONTEÚDO'],
      preco: ['PMPF', 'PRECO', 'PREÇO', 'VALOR']
    },
    features: {
      split_2_columns: true,
      parallel_tables_split: false,
      matrix_header: false,
      subheaders: true,
      ignore_noise: true
    }
  },
  MG: {
    header_mappings: {
      codigo: ['CODIGO', 'CÓDIGO', 'NCM', 'ITEM', 'CÓDIGO DO FABRICANTE'],
      descricao: ['PRODUTO', 'MARCA', 'DESCRICAO', 'DESCRIÇÃO'],
      embalagem: ['EMBALAGEM', 'RECIPIENTE'],
      volume: ['VOLUME', 'CAPACIDADE', 'CONTEUDO', 'CONTEÚDO'],
      preco: ['PMPF', 'PRECO', 'PREÇO', 'VALOR']
    },
    features: {
      split_2_columns: false,
      parallel_tables_split: true,
      matrix_header: false,
      subheaders: false,
      ignore_noise: true
    }
  },
  MA: {
    header_mappings: {
      codigo: ['CODIGO', 'CÓDIGO', 'NCM', 'ITEM'],
      descricao: ['PRODUTO', 'MARCA', 'DESCRICAO', 'DESCRIÇÃO'],
      embalagem: ['EMBALAGEM', 'RECIPIENTE'],
      volume: ['VOLUME', 'CAPACIDADE', 'CONTEUDO', 'CONTEÚDO'],
      preco: ['PMPF', 'PRECO', 'PREÇO', 'VALOR']
    },
    features: {
      split_2_columns: false,
      parallel_tables_split: true,
      matrix_header: false,
      subheaders: false,
      ignore_noise: true
    }
  }
};

class UfCompactorRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS uf_compactor_configs (
        uf VARCHAR(2) PRIMARY KEY,
        header_mappings JSONB NOT NULL DEFAULT '{}'::jsonb,
        features JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(255)
      );
    `;
    await db.query(queryText);
    return db.query('SELECT 1');
  }

  async seed(): Promise<void> {
    for (const [uf, config] of Object.entries(DEFAULT_CONFIGS)) {
      const check = await db.query('SELECT uf FROM uf_compactor_configs WHERE uf = $1', [uf]);
      if ((check.rowCount || 0) === 0) {
        await db.query(
          `INSERT INTO uf_compactor_configs (uf, header_mappings, features, updated_by)
           VALUES ($1, $2, $3, $4)`,
          [
            uf,
            JSON.stringify(config.header_mappings || {}),
            JSON.stringify(config.features || {}),
            'system_seed'
          ]
        );
      }
    }
  }

  async getAll(): Promise<UfCompactorConfigRow[]> {
    const result = await db.query('SELECT * FROM uf_compactor_configs ORDER BY uf ASC');
    return result.rows;
  }

  async getByUf(uf: string): Promise<UfCompactorConfigRow | null> {
    const result = await db.query('SELECT * FROM uf_compactor_configs WHERE UPPER(uf) = UPPER($1)', [uf]);
    return result.rows[0] || null;
  }

  async upsert(
    uf: string,
    headerMappings: Record<string, string[]>,
    features: Record<string, boolean>,
    updatedBy?: string
  ): Promise<UfCompactorConfigRow> {
    const cleanUf = uf.toUpperCase();
    const queryText = `
      INSERT INTO uf_compactor_configs (uf, header_mappings, features, updated_at, updated_by)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      ON CONFLICT (uf) DO UPDATE SET
        header_mappings = EXCLUDED.header_mappings,
        features = EXCLUDED.features,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = EXCLUDED.updated_by
      RETURNING *;
    `;
    const result = await db.query(queryText, [
      cleanUf,
      JSON.stringify(headerMappings),
      JSON.stringify(features),
      updatedBy || 'admin'
    ]);
    return result.rows[0];
  }

  async delete(uf: string): Promise<boolean> {
    const result = await db.query('DELETE FROM uf_compactor_configs WHERE UPPER(uf) = UPPER($1)', [uf]);
    return (result.rowCount || 0) > 0;
  }
}

export default new UfCompactorRepository();
