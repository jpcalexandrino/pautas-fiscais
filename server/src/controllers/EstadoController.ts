import { Request, Response } from 'express';
import EstadoRepository from '../repositories/EstadoRepository';

export async function getAll(_req: Request, res: Response) {
  try {
    const result = await EstadoRepository.getAll();
    res.json(
      result.rows.map((row) => ({
        id: row.sk_estado,
        uf: row.nk_uf,
        nome: row.nome_estado,
      }))
    );
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}
