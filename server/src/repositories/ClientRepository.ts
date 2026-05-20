import db from '../config/db';
import { QueryResult } from 'pg';

export interface ClientRow {
  sk_cliente?: number;
  nk_uc?: string;
  nome: string;
  distribuidora?: string;
  subgrupo?: string;
  nk_cnpj?: string;
  email_contato?: string;
  cep?: string;
  uf?: string;
  cidade?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
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
      CREATE TABLE IF NOT EXISTS dim_clientes (
        sk_cliente SERIAL PRIMARY KEY,
        nk_uc TEXT,
        nome TEXT NOT NULL,
        distribuidora TEXT,
        subgrupo TEXT,
        nk_cnpj TEXT,
        email_contato TEXT,
        cep TEXT,
        uf TEXT,
        cidade TEXT,
        endereco TEXT,
        numero TEXT,
        complemento TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    return db.query(queryText);
  }

  async findByUcOrCnpj(nk_uc?: string): Promise<QueryResult> {
    const normalizedUc = this.normalizeUniqueValue(nk_uc);
    const conditions: string[] = [];
    const values: any[] = [];

    if (normalizedUc) {
      conditions.push(`regexp_replace(lower(nk_uc), '[^0-9a-z]', '', 'g') = $${values.length + 1}`);
      values.push(normalizedUc);
    }

    if (conditions.length === 0) {
      return db.query('SELECT * FROM dim_clientes WHERE false');
    }

    const queryText = `SELECT * FROM dim_clientes WHERE ${conditions.join(' OR ')}`;
    return db.query(queryText, values);
  }

  async findByUcOrCnpjExcludingId(id: string | number, nk_uc?: string): Promise<QueryResult> {
    const normalizedUc = this.normalizeUniqueValue(nk_uc);
    const conditions: string[] = [];
    const values: any[] = [id];

    if (normalizedUc) {
      conditions.push(`regexp_replace(lower(nk_uc), '[^0-9a-z]', '', 'g') = $${values.length + 1}`);
      values.push(normalizedUc);
    }

    if (conditions.length === 0) {
      return db.query('SELECT * FROM dim_clientes WHERE false');
    }

    const queryText = `SELECT * FROM dim_clientes WHERE sk_cliente <> $1 AND (${conditions.join(' OR ')})`;
    return db.query(queryText, values);
  }

  async getAll(): Promise<QueryResult> {
    return db.query('SELECT * FROM dim_clientes ORDER BY nome ASC');
  }

  async getById(id: string | number): Promise<QueryResult> {
    return db.query('SELECT * FROM dim_clientes WHERE sk_cliente = $1', [id]);
  }

  async create(client: ClientRow): Promise<QueryResult> {
    const {
      nk_uc, nome, distribuidora, subgrupo, nk_cnpj,
      email_contato, cep, uf, cidade, endereco, numero, complemento
    } = client;
    const queryText = `
      INSERT INTO dim_clientes (
        nk_uc, nome, distribuidora, subgrupo, nk_cnpj, 
        email_contato, cep, uf, cidade, endereco, numero, complemento
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    return db.query(queryText, [
      nk_uc, nome, distribuidora, subgrupo, nk_cnpj,
      email_contato, cep, uf, cidade, endereco, numero, complemento
    ]);
  }

  async bulkCreate(clients: ClientRow[]): Promise<QueryResult | { rows: any[] }> {
    if (!clients || clients.length === 0) {
      return { rows: [] };
    }

    const COLS = 12;
    const clientValues = clients.map(c => [
      String(c.nk_uc || ''), c.nome || '', c.distribuidora || '', c.subgrupo || '',
      String(c.nk_cnpj || ''), c.email_contato || '', c.cep || '', c.uf || '',
      c.cidade || '', c.endereco || '', String(c.numero || ''), c.complemento || ''
    ]);

    let placeholders = '';
    const flattenedValues: any[] = [];

    clientValues.forEach((client, i) => {
      const offset = i * COLS;
      placeholders += `(${Array.from({ length: COLS }, (_, j) => `$${offset + j + 1}`).join(', ')})${i < clientValues.length - 1 ? ', ' : ''}`;
      flattenedValues.push(...client);
    });

    const queryText = `
      INSERT INTO dim_clientes (
        nk_uc, nome, distribuidora, subgrupo, nk_cnpj, 
        email_contato, cep, uf, cidade, endereco, numero, complemento
      )
      VALUES ${placeholders}
      RETURNING *;
    `;
    return db.query(queryText, flattenedValues);
  }

  async update(id: string | number, client: ClientRow): Promise<QueryResult> {
    const {
      nk_uc, nome, distribuidora, subgrupo, nk_cnpj,
      email_contato, cep, uf, cidade, endereco, numero, complemento
    } = client;
    const queryText = `
      UPDATE dim_clientes
      SET nk_uc = $1, nome = $2, distribuidora = $3, subgrupo = $4, nk_cnpj = $5, 
          email_contato = $6, cep = $7, uf = $8, cidade = $9, endereco = $10, 
          numero = $11, complemento = $12
      WHERE sk_cliente = $13
      RETURNING *;
    `;
    return db.query(queryText, [
      nk_uc, nome, distribuidora, subgrupo, nk_cnpj,
      email_contato, cep, uf, cidade, endereco, numero, complemento, id
    ]);
  }

  async delete(id: string | number): Promise<QueryResult> {
    return db.query('DELETE FROM dim_clientes WHERE sk_cliente = $1', [id]);
  }
}

export default new ClientRepository();
