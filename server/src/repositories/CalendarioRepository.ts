import db from '../config/db';
import { QueryResult } from 'pg';
import { dateToSkData } from '../utils/normalize';

export interface CalendarioRow {
  sk_data: number;
  data_completa: string;
  ano: number;
  mes: number;
  dia: number;
  trimestre: number;
}

class CalendarioRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS dim_calendario (
        sk_data INT PRIMARY KEY,
        data_completa DATE NOT NULL UNIQUE,
        ano INT NOT NULL,
        mes INT NOT NULL,
        dia INT NOT NULL,
        trimestre INT NOT NULL
      );
    `;
    return db.query(queryText);
  }

  async seed(startYear = 2020, endYear = 2035): Promise<void> {
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    const current = new Date(start);

    while (current <= end) {
      const ano = current.getFullYear();
      const mes = current.getMonth() + 1;
      const dia = current.getDate();
      const trimestre = Math.ceil(mes / 3);
      const sk_data = dateToSkData(current);
      const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

      await db.query(
        `INSERT INTO dim_calendario (sk_data, data_completa, ano, mes, dia, trimestre)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (sk_data) DO NOTHING`,
        [sk_data, dataStr, ano, mes, dia, trimestre]
      );

      current.setDate(current.getDate() + 1);
    }
  }

  async getBySkData(sk_data: number): Promise<QueryResult> {
    return db.query('SELECT * FROM dim_calendario WHERE sk_data = $1', [sk_data]);
  }

  async ensureDate(date: Date): Promise<number> {
    const sk_data = dateToSkData(date);
    const existing = await this.getBySkData(sk_data);
    if (existing.rows.length > 0) {
      return sk_data;
    }
    const ano = date.getFullYear();
    const mes = date.getMonth() + 1;
    const dia = date.getDate();
    const trimestre = Math.ceil(mes / 3);
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    await db.query(
      `INSERT INTO dim_calendario (sk_data, data_completa, ano, mes, dia, trimestre)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (sk_data) DO NOTHING`,
      [sk_data, dataStr, ano, mes, dia, trimestre]
    );
    return sk_data;
  }
}

export default new CalendarioRepository();
