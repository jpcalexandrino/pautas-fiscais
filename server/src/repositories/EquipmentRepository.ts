import db from '../config/db';
import { QueryResult } from 'pg';

export interface EquipmentRow {
  id?: number;
  client_id: number;
  name: string;
  power_w?: number;
  hours_per_day?: number;
  wh_per_day?: number;
  quantity?: number;
  tariff?: number;
  created_at?: Date;
}

class EquipmentRepository {
  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS equipment (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        power_w NUMERIC DEFAULT 0,
        hours_per_day NUMERIC DEFAULT 0,
        wh_per_day NUMERIC DEFAULT 0,
        quantity INTEGER DEFAULT 1,
        tariff NUMERIC DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }

  async getByClient(clientId: string | number): Promise<QueryResult> {
    const queryText = 'SELECT * FROM equipment WHERE client_id = $1 ORDER BY name ASC';
    return db.query(queryText, [clientId]);
  }

  async create(equipment: EquipmentRow): Promise<QueryResult> {
    const { client_id, name, power_w, hours_per_day, wh_per_day, quantity, tariff } = equipment;
    const queryText = `
      INSERT INTO equipment (client_id, name, power_w, hours_per_day, wh_per_day, quantity, tariff)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    return db.query(queryText, [
      client_id, 
      name || 'Equipamento', 
      Number.parseFloat(String(power_w)) || 0, 
      Number.parseFloat(String(hours_per_day)) || 0, 
      Number.parseFloat(String(wh_per_day)) || 0, 
      Number.parseInt(String(quantity)) || 1,
      Number.parseFloat(String(tariff)) || 0
    ]);
  }

  async update(id: string | number, equipment: Partial<EquipmentRow>): Promise<QueryResult> {
    const { name, power_w, hours_per_day, wh_per_day, quantity, tariff } = equipment;
    const queryText = `
      UPDATE equipment
      SET name = $1, power_w = $2, hours_per_day = $3, wh_per_day = $4, quantity = $5, tariff = $6
      WHERE id = $7
      RETURNING *;
    `;
    return db.query(queryText, [
      name || 'Equipamento', 
      Number.parseFloat(String(power_w)) || 0, 
      Number.parseFloat(String(hours_per_day)) || 0, 
      Number.parseFloat(String(wh_per_day)) || 0, 
      Number.parseInt(String(quantity)) || 1, 
      Number.parseFloat(String(tariff)) || 0,
      Number.parseInt(String(id))
    ]);
  }

  async delete(id: string | number): Promise<QueryResult> {
    return db.query('DELETE FROM equipment WHERE id = $1', [Number.parseInt(String(id))]);
  }
}

export default new EquipmentRepository();
