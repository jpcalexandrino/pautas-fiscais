import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import TermoRepository from '../repositories/TermoRepository';
import { loadBrandSlugsFromDb } from '../services/brandSlugs';

function mapFromDb(dbRow: any) {
  if (!dbRow) return null;
  return {
    id: dbRow.sk_termo,
    termo: dbRow.termo,
    tipo: dbRow.tipo || 'proprio',
    created_at: dbRow.created_at,
  };
}

export async function getAll(req: Request, res: Response) {
  try {
    const tipo = req.query.tipo as string;
    const result = await TermoRepository.getAll(tipo);
    res.json(result.rows.map(mapFromDb));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const { termo, tipo } = req.body;
    const userRole = req.userRole;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem cadastrar termos' });
    }

    if (!termo || !termo.trim()) {
      return res.status(400).json({ error: 'O termo é obrigatório' });
    }

    const result = await TermoRepository.create(termo, tipo || 'proprio');
    await loadBrandSlugsFromDb(); // Reload the cache
    res.status(201).json(mapFromDb(result.rows[0]));
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation in postgres
      return res.status(400).json({ error: 'Este termo já está cadastrado' });
    }
    res.status(500).json({ error: error.message });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id;
    const userRole = req.userRole;

    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem excluir termos' });
    }

    const result = await TermoRepository.delete(Number(id));
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Termo não encontrado' });
    }

    await loadBrandSlugsFromDb(); // Reload the cache
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export { remove as delete };
