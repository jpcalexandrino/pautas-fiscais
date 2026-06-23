import db from '../config/db';
import { QueryResult } from 'pg';

export interface EstadoRow {
  sk_estado?: number;
  nk_uf: string;
  nome_estado: string;
}

const UFS_BRASIL: EstadoRow[] = [
  { nk_uf: 'AC', nome_estado: 'Acre' },
  { nk_uf: 'AL', nome_estado: 'Alagoas' },
  { nk_uf: 'AP', nome_estado: 'Amapá' },
  { nk_uf: 'AM', nome_estado: 'Amazonas' },
  { nk_uf: 'BA', nome_estado: 'Bahia' },
  { nk_uf: 'CE', nome_estado: 'Ceará' },
  { nk_uf: 'DF', nome_estado: 'Distrito Federal' },
  { nk_uf: 'ES', nome_estado: 'Espírito Santo' },
  { nk_uf: 'GO', nome_estado: 'Goiás' },
  { nk_uf: 'MA', nome_estado: 'Maranhão' },
  { nk_uf: 'MT', nome_estado: 'Mato Grosso' },
  { nk_uf: 'MS', nome_estado: 'Mato Grosso do Sul' },
  { nk_uf: 'MG', nome_estado: 'Minas Gerais' },
  { nk_uf: 'PA', nome_estado: 'Pará' },
  { nk_uf: 'PB', nome_estado: 'Paraíba' },
  { nk_uf: 'PR', nome_estado: 'Paraná' },
  { nk_uf: 'PE', nome_estado: 'Pernambuco' },
  { nk_uf: 'PI', nome_estado: 'Piauí' },
  { nk_uf: 'RJ', nome_estado: 'Rio de Janeiro' },
  { nk_uf: 'RN', nome_estado: 'Rio Grande do Norte' },
  { nk_uf: 'RS', nome_estado: 'Rio Grande do Sul' },
  { nk_uf: 'RO', nome_estado: 'Rondônia' },
  { nk_uf: 'RR', nome_estado: 'Roraima' },
  { nk_uf: 'SC', nome_estado: 'Santa Catarina' },
  { nk_uf: 'SP', nome_estado: 'São Paulo' },
  { nk_uf: 'SE', nome_estado: 'Sergipe' },
  { nk_uf: 'TO', nome_estado: 'Tocantins' },
];

class EstadoRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS dim_estado (
        sk_estado SERIAL PRIMARY KEY,
        nk_uf CHAR(2) NOT NULL UNIQUE,
        nome_estado VARCHAR(100) NOT NULL
      );
    `;
    return db.query(queryText);
  }

  async seed(): Promise<void> {
    for (const uf of UFS_BRASIL) {
      await db.query(
        `INSERT INTO dim_estado (nk_uf, nome_estado)
         VALUES ($1, $2)
         ON CONFLICT (nk_uf) DO NOTHING`,
        [uf.nk_uf, uf.nome_estado]
      );
    }
  }

  async getAll(): Promise<QueryResult> {
    return db.query('SELECT * FROM dim_estado ORDER BY nome_estado ASC');
  }

  async getByUf(nk_uf: string): Promise<QueryResult> {
    return db.query('SELECT * FROM dim_estado WHERE nk_uf = $1', [nk_uf.toUpperCase()]);
  }

  async getById(sk_estado: number): Promise<QueryResult> {
    return db.query('SELECT * FROM dim_estado WHERE sk_estado = $1', [sk_estado]);
  }
}

export default new EstadoRepository();
