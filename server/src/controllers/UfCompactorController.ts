import { Request, Response } from 'express';
import UfCompactorRepository from '../repositories/UfCompactorRepository';

export async function getAllConfigs(req: Request, res: Response): Promise<void> {
  try {
    const configs = await UfCompactorRepository.getAll();
    res.json(configs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar configurações de compactadores.' });
  }
}

export async function getConfigByUf(req: Request, res: Response): Promise<void> {
  try {
    const { uf } = req.params;
    const config = await UfCompactorRepository.getByUf(uf);
    if (!config) {
      res.status(404).json({ error: `Configuração não encontrada para a UF ${uf}` });
      return;
    }
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar configuração por UF.' });
  }
}

export async function updateConfig(req: Request, res: Response): Promise<void> {
  try {
    const { uf } = req.params;
    const { header_mappings, features } = req.body;
    const updatedBy = (req as any).user?.email || 'admin';

    if (!header_mappings || !features) {
      res.status(400).json({ error: 'Os campos header_mappings e features são obrigatórios.' });
      return;
    }

    const updated = await UfCompactorRepository.upsert(uf, header_mappings, features, updatedBy);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao salvar configuração do compactador.' });
  }
}

export async function deleteConfig(req: Request, res: Response): Promise<void> {
  try {
    const { uf } = req.params;
    const deleted = await UfCompactorRepository.delete(uf);
    res.json({ success: deleted });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao resetar configuração da UF.' });
  }
}
