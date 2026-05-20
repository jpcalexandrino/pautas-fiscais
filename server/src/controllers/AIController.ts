import { Request, Response } from 'express';
import AIService from '../services/AIService';

export async function getOptimizationSuggestions(req: Request, res: Response) {
  try {
    const { fatura, equipment, previousMonthData } = req.body;

    if (!fatura) {
      return res.status(400).json({ error: 'Dados da fatura são necessários' });
    }

    const suggestions = await AIService.getOptimizationSuggestions(fatura, equipment || [], previousMonthData);
    res.json({ suggestions });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao gerar sugestões de IA', details: error.message });
  }
}
