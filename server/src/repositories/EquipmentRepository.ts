import db from '../config/db';
import { QueryResult } from 'pg';

export interface EquipmentRow {
  sk_equipamento?: number;
  fk_cliente: number;
  nome: string;
  potencia_w?: number;
  horas_uso_dia?: number;
  wh_dia?: number;
  quantidade?: number;
  tarifa?: number;
  created_at?: Date;
}

class EquipmentRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS dim_equipamentos (
        sk_equipamento SERIAL PRIMARY KEY,
        fk_cliente INTEGER REFERENCES dim_clientes(sk_cliente) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        potencia_w NUMERIC DEFAULT 0,
        horas_uso_dia NUMERIC DEFAULT 0,
        wh_dia NUMERIC DEFAULT 0,
        quantidade INTEGER DEFAULT 1,
        tarifa NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }

  async getByClient(clientId: string | number): Promise<QueryResult> {
    const queryText = 'SELECT * FROM dim_equipamentos WHERE fk_cliente = $1 ORDER BY nome ASC';
    return db.query(queryText, [clientId]);
  }

  async create(equipment: EquipmentRow): Promise<QueryResult> {
    const { fk_cliente, nome, potencia_w, horas_uso_dia, wh_dia, quantidade, tarifa } = equipment;
    const queryText = `
      INSERT INTO dim_equipamentos (fk_cliente, nome, potencia_w, horas_uso_dia, wh_dia, quantidade, tarifa)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    return db.query(queryText, [
      fk_cliente, 
      nome || 'Equipamento', 
      Number.parseFloat(String(potencia_w)) || 0, 
      Number.parseFloat(String(horas_uso_dia)) || 0, 
      Number.parseFloat(String(wh_dia)) || 0, 
      Number.parseInt(String(quantidade)) || 1,
      Number.parseFloat(String(tarifa)) || 0
    ]);
  }

  async update(id: string | number, equipment: Partial<EquipmentRow>): Promise<QueryResult> {
    const { nome, potencia_w, horas_uso_dia, wh_dia, quantidade, tarifa } = equipment;
    const queryText = `
      UPDATE dim_equipamentos
      SET nome = $1, potencia_w = $2, horas_uso_dia = $3, wh_dia = $4, quantidade = $5, tarifa = $6
      WHERE sk_equipamento = $7
      RETURNING *;
    `;
    return db.query(queryText, [
      nome || 'Equipamento', 
      Number.parseFloat(String(potencia_w)) || 0, 
      Number.parseFloat(String(horas_uso_dia)) || 0, 
      Number.parseFloat(String(wh_dia)) || 0, 
      Number.parseInt(String(quantidade)) || 1, 
      Number.parseFloat(String(tarifa)) || 0,
      Number.parseInt(String(id))
    ]);
  }

  async delete(id: string | number): Promise<QueryResult> {
    return db.query('DELETE FROM dim_equipamentos WHERE sk_equipamento = $1', [Number.parseInt(String(id))]);
  }
}

export default new EquipmentRepository();
