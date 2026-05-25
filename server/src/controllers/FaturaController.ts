import { Request, Response } from 'express';
import FaturaRepository from '../repositories/FaturaRepository';
import FaturaService from '../services/FaturaService';
import PowerHubService from '../services/PowerHubService';

export async function upload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const sanitizedRows = await FaturaService.processFile(req.file.buffer, req.file.originalname);
    res.status(200).json({ message: 'Arquivo processado', rows: sanitizedRows });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}

export async function save(req: Request, res: Response) {
  try {
    const { faturas } = req.body;
    if (!faturas || !Array.isArray(faturas)) {
      return res.status(400).json({ error: 'Lista de faturas inválida' });
    }

    const count = await FaturaService.saveFaturas(faturas);
    res.status(201).json({ message: 'Dados salvos com sucesso', count });
  } catch (error: any) {
    console.error('Erro no FaturaController.save:', error);
    res.status(500).json({ error: 'Erro ao salvar faturas', details: error.message });
  }
}

export async function getAll(req: Request, res: Response) {
  try {
    const result = await FaturaRepository.getAll();
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar faturas', details: error.message });
  }
}

export async function syncPowerHub(req: Request, res: Response) {
  try {
    const { installationId, referenceMonth } = req.body;
    const stats = await PowerHubService.sync({ installationId, referenceMonth });
    res.status(200).json({
      message: 'Sincronização concluída com sucesso',
      stats
    });
  } catch (error: any) {
    console.error('Erro no FaturaController.syncPowerHub:', error);
    res.status(500).json({ error: 'Erro ao sincronizar com PowerHUB', details: error.message });
  }
}
