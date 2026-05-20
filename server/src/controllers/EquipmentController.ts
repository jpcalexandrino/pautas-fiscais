import { Request, Response } from 'express';
import EquipmentRepository from '../repositories/EquipmentRepository';

function mapToDb(equipment: any): any {
  if (!equipment) return null;
  return {
    sk_equipamento: equipment.id,
    fk_cliente: equipment.client_id,
    nome: equipment.name,
    potencia_w: equipment.power_w,
    horas_uso_dia: equipment.hours_per_day,
    wh_dia: equipment.wh_per_day,
    quantidade: equipment.quantity,
    tarifa: equipment.tariff,
  };
}

function mapFromDb(dbRow: any): any {
  if (!dbRow) return null;
  return {
    id: dbRow.sk_equipamento,
    client_id: dbRow.fk_cliente,
    name: dbRow.nome,
    power_w: dbRow.potencia_w,
    hours_per_day: dbRow.horas_uso_dia,
    wh_per_day: dbRow.wh_dia,
    quantity: dbRow.quantidade,
    tariff: dbRow.tarifa,
    created_at: dbRow.created_at,
  };
}

export async function getByClient(req: Request, res: Response) {
  try {
    const result = await EquipmentRepository.getByClient(req.params.clientId as string);
    res.json(result.rows.map(mapFromDb));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const mappedBody = mapToDb(req.body);
    const result = await EquipmentRepository.create(mappedBody);
    res.status(201).json(mapFromDb(result.rows[0]));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const mappedBody = mapToDb(req.body);
    const result = await EquipmentRepository.update(req.params.id as string, mappedBody);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipamento não encontrado' });
    }
    res.json(mapFromDb(result.rows[0]));
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
