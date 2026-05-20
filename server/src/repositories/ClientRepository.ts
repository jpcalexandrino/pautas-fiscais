import db from '../config/db';
import { QueryResult } from 'pg';

export interface ClientRow {
  id?: number;
  uc_number?: string;
  name: string;
  distributor?: string;
  subgroup?: string;
  cnpj?: string;
  contact_email?: string;
  cep?: string;
  uf?: string;
  city?: string;
  address?: string;
  number?: string;
  complement?: string;
  created_at?: Date;
}

class ClientRepository {
  private normalizeUniqueValue(value?: string): string {
    if (!value) return '';
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^0-9a-z]/g, '');
  }

  async createTable(): Promise<QueryResult> {
    const queryText = `
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        uc_number TEXT,
        name TEXT NOT NULL,
        distributor TEXT,
        subgroup TEXT,
        cnpj TEXT,
        contact_email TEXT,
        cep TEXT,
        uf TEXT,
        city TEXT,
        address TEXT,
        number TEXT,
        complement TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }

  async findByUcOrCnpj(uc_number?: string): Promise<QueryResult> {
    const normalizedUc = this.normalizeUniqueValue(uc_number);
    const conditions: string[] = [];
    const values: any[] = [];

    if (normalizedUc) {
      conditions.push(`regexp_replace(lower(uc_number), '[^0-9a-z]', '', 'g') = $${values.length + 1}`);
      values.push(normalizedUc);
    }

    if (conditions.length === 0) {
      return db.query('SELECT * FROM clients WHERE false');
    }

    const queryText = `SELECT * FROM clients WHERE ${conditions.join(' OR ')}`;
    return db.query(queryText, values);
  }

  async findByUcOrCnpjExcludingId(id: string | number, uc_number?: string): Promise<QueryResult> {
    const normalizedUc = this.normalizeUniqueValue(uc_number);
    const conditions: string[] = [];
    const values: any[] = [id];

    if (normalizedUc) {
      conditions.push(`regexp_replace(lower(uc_number), '[^0-9a-z]', '', 'g') = $${values.length + 1}`);
      values.push(normalizedUc);
    }

    if (conditions.length === 0) {
      return db.query('SELECT * FROM clients WHERE false');
    }

    const queryText = `SELECT * FROM clients WHERE id <> $1 AND (${conditions.join(' OR ')})`;
    return db.query(queryText, values);
  }

  async getAll(): Promise<QueryResult> {
    return db.query('SELECT * FROM clients ORDER BY name ASC');
  }

  async getById(id: string | number): Promise<QueryResult> {
    return db.query('SELECT * FROM clients WHERE id = $1', [id]);
  }

  async create(client: ClientRow): Promise<QueryResult> {
    const {
      uc_number, name, distributor, subgroup, cnpj,
      contact_email, cep, uf, city, address, number, complement
    } = client;
    const queryText = `
      INSERT INTO clients (
        uc_number, name, distributor, subgroup, cnpj, 
        contact_email, cep, uf, city, address, number, complement
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    return db.query(queryText, [
      uc_number, name, distributor, subgroup, cnpj,
      contact_email, cep, uf, city, address, number, complement
    ]);
  }

  async bulkCreate(clients: ClientRow[]): Promise<QueryResult | { rows: any[] }> {
    if (!clients || clients.length === 0) {
      return { rows: [] };
    }

    const COLS = 12;
    const clientValues = clients.map(c => [
      String(c.uc_number || ''), c.name || '', c.distributor || '', c.subgroup || '',
      String(c.cnpj || ''), c.contact_email || '', c.cep || '', c.uf || '',
      c.city || '', c.address || '', String(c.number || ''), c.complement || ''
    ]);

    let placeholders = '';
    const flattenedValues: any[] = [];

    clientValues.forEach((client, i) => {
      const offset = i * COLS;
      placeholders += `(${Array.from({ length: COLS }, (_, j) => `$${offset + j + 1}`).join(', ')})${i < clientValues.length - 1 ? ', ' : ''}`;
      flattenedValues.push(...client);
    });

    const queryText = `
      INSERT INTO clients (
        uc_number, name, distributor, subgroup, cnpj, 
        contact_email, cep, uf, city, address, number, complement
      )
      VALUES ${placeholders}
      RETURNING *;
    `;
    return db.query(queryText, flattenedValues);
  }

  async update(id: string | number, client: ClientRow): Promise<QueryResult> {
    const {
      uc_number, name, distributor, subgroup, cnpj,
      contact_email, cep, uf, city, address, number, complement
    } = client;
    const queryText = `
      UPDATE clients
      SET uc_number = $1, name = $2, distributor = $3, subgroup = $4, cnpj = $5, 
          contact_email = $6, cep = $7, uf = $8, city = $9, address = $10, 
          number = $11, complement = $12
      WHERE id = $13
      RETURNING *;
    `;
    return db.query(queryText, [
      uc_number, name, distributor, subgroup, cnpj,
      contact_email, cep, uf, city, address, number, complement, id
    ]);
  }

  async delete(id: string | number): Promise<QueryResult> {
    return db.query('DELETE FROM clients WHERE id = $1', [id]);
  }
}

export default new ClientRepository();
