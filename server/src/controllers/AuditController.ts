import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import AuditRepository from '../repositories/AuditRepository';

export async function getAll(req: AuthRequest, res: Response) {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    }
    const result = await AuditRepository.getAll();
    res.json(result.rows);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}
