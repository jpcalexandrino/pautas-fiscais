import { Request, Response } from 'express';
import EquipmentRepository from '../repositories/EquipmentRepository';

export async function getByClient(req: Request, res: Response) {
  try {
    const result = await EquipmentRepository.getByClient(req.params.clientId as string);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const result = await EquipmentRepository.create(req.body);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const result = await EquipmentRepository.update(req.params.id as string, req.body);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await EquipmentRepository.delete(req.params.id as string);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export { remove as delete };
