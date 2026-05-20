import { Request, Response } from 'express';
import ClientRepository from '../repositories/ClientRepository';

function mapToDb(client: any): any {
  if (!client) return null;
  return {
    sk_cliente: client.id,
    nk_uc: client.uc_number,
    nome: client.name,
    distribuidora: client.distributor,
    subgrupo: client.subgroup,
    nk_cnpj: client.cnpj,
    email_contato: client.contact_email,
    cep: client.cep,
    uf: client.uf,
    cidade: client.city,
    endereco: client.address,
    numero: client.number,
    complemento: client.complement,
  };
}

function mapFromDb(dbRow: any): any {
  if (!dbRow) return null;
  return {
    id: dbRow.sk_cliente,
    uc_number: dbRow.nk_uc,
    name: dbRow.nome,
    distributor: dbRow.distribuidora,
    subgroup: dbRow.subgrupo,
    cnpj: dbRow.nk_cnpj,
    contact_email: dbRow.email_contato,
    cep: dbRow.cep,
    uf: dbRow.uf,
    city: dbRow.cidade,
    address: dbRow.endereco,
    number: dbRow.numero,
    complement: dbRow.complemento,
    created_at: dbRow.criado_em,
  };
}

export async function getAll(req: Request, res: Response) {
  try {
    const result = await ClientRepository.getAll();
    res.json(result.rows.map(mapFromDb));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const result = await ClientRepository.getById(req.params.id as string);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(mapFromDb(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const mappedBody = mapToDb(req.body);
    const existing = await ClientRepository.findByUcOrCnpj(mappedBody.nk_uc);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cliente já cadastrado com mesmo Número da UC' });
    }

    const result = await ClientRepository.create(mappedBody);
    res.status(201).json(mapFromDb(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function bulkCreate(req: Request, res: Response) {
  try {
    const clients = req.body as any[];
    const createdRows: any[] = [];
    const skipped: any[] = [];

    for (const client of clients) {
      const mappedClient = mapToDb(client);
      const existing = await ClientRepository.findByUcOrCnpj(mappedClient.nk_uc);
      if (existing.rows.length > 0) {
        skipped.push({ client, reason: 'duplicado' });
        continue;
      }
      const result = await ClientRepository.create(mappedClient);
      createdRows.push(mapFromDb(result.rows[0]));
    }

    res.status(201).json({ created: createdRows, skipped });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const mappedBody = mapToDb(req.body);
    const existing = await ClientRepository.findByUcOrCnpjExcludingId(req.params.id as string, mappedBody.nk_uc);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Já existe outro cliente com mesmo Número da UC' });
    }

    const result = await ClientRepository.update(req.params.id as string, mappedBody);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(mapFromDb(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await ClientRepository.delete(req.params.id as string);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export { remove as delete };
