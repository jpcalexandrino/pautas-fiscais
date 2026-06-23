import { Request, Response } from 'express';
import PautaFiscalService from '../services/PautaFiscalService';
import PautaFiscalRepository from '../repositories/PautaFiscalRepository';

function mapPautaFromDb(row: Record<string, unknown>) {
  return {
    id: row.sk_pauta,
    fk_produto: row.fk_produto,
    fk_estado: row.fk_estado,
    uf: row.nk_uf,
    nome_estado: row.nome_estado,
    descricao_interna: row.descricao_interna,
    gtin_13: row.gtin_13,
    codigo_interno: row.nk_codigo_interno,
    embalagem: row.embalagem,
    conteudo_volume: row.conteudo_volume,
    data: row.data,
    valor_pauta: row.valor_pauta,
    status: row.status,
    arquivo_origem: row.arquivo_origem,
    created_at: row.created_at,
  };
}

function mapPendenteFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    uf: row.fk_estado_nk,
    nome_estado: row.nome_estado,
    descricao_estado: row.descricao_estado,
    gtin_extraido: row.gtin_extraido,
    valor_pauta: row.valor_pauta,
    data: row.fk_data,
    arquivo_origem: row.arquivo_origem,
    created_at: row.created_at,
    dados_extraidos: row.dados_extraidos,
  };
}

export async function upload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo não enviado' });
    }
    const uf = (req.body.uf || '').toUpperCase();
    if (!uf || uf.length !== 2) {
      return res.status(400).json({ error: 'UF do estado é obrigatória' });
    }

    const result = await PautaFiscalService.processUpload(
      req.file.buffer,
      req.file.originalname,
      uf
    );
    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getAll(req: Request, res: Response) {
  try {
    const filters: { fk_estado?: number; fk_produto?: number } = {};
    if (req.query.fk_estado) filters.fk_estado = Number(req.query.fk_estado);
    if (req.query.fk_produto) filters.fk_produto = Number(req.query.fk_produto);

    const result = await PautaFiscalRepository.getAll(filters);
    res.json(result.rows.map(mapPautaFromDb));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getPendentes(req: Request, res: Response) {
  try {
    const uf = req.query.uf as string | undefined;
    const result = await PautaFiscalRepository.getPendentes(uf);
    res.json(result.rows.map(mapPendenteFromDb));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function confirmPendente(req: Request, res: Response) {
  try {
    const { fk_produto, salvar_de_para } = req.body;
    if (!fk_produto) {
      return res.status(400).json({ error: 'Produto é obrigatório' });
    }
    await PautaFiscalService.confirmPendente(
      Number(req.params.id),
      Number(fk_produto),
      Boolean(salvar_de_para)
    );
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deletePendente(req: Request, res: Response) {
  try {
    await PautaFiscalRepository.deletePendente(Number(req.params.id));
    res.status(204).send();
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function deleteAllPendentes(req: Request, res: Response) {
  try {
    await PautaFiscalRepository.deleteAllPendentes();
    res.status(204).send();
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getArquivosOcr(req: Request, res: Response) {
  try {
    const result = await PautaFiscalRepository.getOcrFiles();
    res.json(result.rows);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function reprocessarComIA(req: Request, res: Response) {
  try {
    const { filename, uf } = req.body;
    if (!filename || !uf) {
      return res.status(400).json({ error: 'Filename e UF são obrigatórios' });
    }
    const result = await PautaFiscalService.reprocessWithAI(filename, uf.toUpperCase());
    res.json(result);
  } catch (error: unknown) {
    const message = (error as Error).message;
    const status = message.includes('não possui um JSON da IA') ? 422 : 500;
    res.status(status).json({ error: message });
  }
}

export async function getArquivoOcrByFilename(req: Request, res: Response) {
  try {
    const filename = String(req.params.filename);
    const result = await PautaFiscalRepository.findOcrByFilename(filename);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}
