import { Request, Response } from 'express';
import ClientRepository from '../repositories/ClientRepository';

export async function getAll(req: Request, res: Response) {
  try {
    const result = await ClientRepository.getAll();
    res.json(result.rows);
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
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const existing = await ClientRepository.findByUcOrCnpj(req.body.uc_number);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Cliente já cadastrado com mesmo Número da UC' });
    }

    const result = await ClientRepository.create(req.body);
    res.status(201).json(result.rows[0]);
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
      const existing = await ClientRepository.findByUcOrCnpj(client.uc_number);
      if (existing.rows.length > 0) {
        skipped.push({ client, reason: 'duplicado' });
        continue;
      }
      const result = await ClientRepository.create(client);
      createdRows.push(result.rows[0]);
    }

    res.status(201).json({ created: createdRows, skipped });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const existing = await ClientRepository.findByUcOrCnpjExcludingId(req.params.id as string, req.body.uc_number);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Já existe outro cliente com mesmo Número da UC' });
    }

    const result = await ClientRepository.update(req.params.id as string, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.json(result.rows[0]);
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
