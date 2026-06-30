import { Request, Response } from 'express';
import PautaFiscalService from '../services/PautaFiscalService';
import PautaFiscalRepository from '../repositories/PautaFiscalRepository';
import { TextractCompactor } from '../services/TextractCompactor';

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


function formatMonthYear(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
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
    const dataPauta = req.body.data_pauta;
    if (!dataPauta) {
      return res.status(400).json({ error: 'Data de vigência é obrigatória para o upload' });
    }

    const formattedFilename = `${uf} - ${formatMonthYear(dataPauta)}.pdf`;

    // Verifica se já existe um arquivo com esse nome no banco para evitar duplicatas
    const existing = await PautaFiscalRepository.findOcrByFilename(formattedFilename);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: `Uma pauta fiscal para ${uf} na vigência ${formatMonthYear(dataPauta)} já foi cadastrada.`
      });
    }

    const result = await PautaFiscalService.processUpload(
      req.file.buffer,
      formattedFilename,
      uf,
      dataPauta
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


function calculateOcrFileStats(row: any) {
  const { id, filename, uf, data_pauta, confirmed_cells, textract_json, created_at } = row;
  
  let totalPrices = 0;
  try {
    const tabelas = TextractCompactor.extractTables(textract_json, uf);
    const priceRegex = /^\s*(?:R\$\s*)?\d+[\.,]\d{2}\s*$/i;
    const isPriceCell = (value: string, header: string) => {
      const normHeader = (header || '').toUpperCase();
      if (normHeader === 'ITEM' || normHeader === 'CNPJ_FABRICANTE' || normHeader === 'COD_FABRICANTE' || normHeader === 'NCM') {
        return false;
      }
      return priceRegex.test(value);
    };

    tabelas.forEach((tabela: any) => {
      tabela.rows.forEach((r: string[]) => {
        r.forEach((cell: string, cIdx: number) => {
          if (isPriceCell(cell, tabela.headers[cIdx])) {
            totalPrices++;
          }
        });
      });
    });
  } catch (err) {
    console.error('Erro ao calcular estatísticas do arquivo OCR:', filename, err);
  }

  const confirmedList = Array.isArray(confirmed_cells) ? confirmed_cells : [];
  const confirmedCount = confirmedList.length;

  return {
    id,
    filename,
    uf,
    data_pauta,
    created_at,
    total_prices: totalPrices,
    confirmed_count: confirmedCount,
    pending_count: Math.max(0, totalPrices - confirmedCount),
  };
}

export async function getArquivosOcr(req: Request, res: Response) {
  try {
    const result = await PautaFiscalRepository.getOcrFiles();
    const detailed = result.rows.map(calculateOcrFileStats);
    res.json(detailed);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
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

export async function getTabelasOcr(req: Request, res: Response) {
  try {
    const filename = String(req.params.filename);
    const result = await PautaFiscalRepository.findOcrByFilename(filename);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    const { textract_json, uf, confirmed_cells } = result.rows[0];
    const tabelas = TextractCompactor.extractTables(textract_json, uf);
    const sugestoesDatas = TextractCompactor.extractDates(textract_json);
    res.json({ tabelas, sugestoesDatas, confirmedCells: confirmed_cells || [], uf });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function confirmarManual(req: Request, res: Response) {
  try {
    const { fk_produto, fk_produtos, uf, descricao_estado, valor_pauta, data_pauta, arquivo_origem, salvar_de_para, cell_key } = req.body;
    if ((!fk_produto && !fk_produtos) || !uf || !descricao_estado || valor_pauta === undefined || !data_pauta || !arquivo_origem) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    const ids = fk_produtos ? fk_produtos.map(Number) : [Number(fk_produto)];

    await PautaFiscalService.confirmManual({
      fk_produtos: ids,
      uf: String(uf),
      descricao_estado: String(descricao_estado),
      valor_pauta: Number(valor_pauta),
      data_pauta: String(data_pauta),
      arquivo_origem: String(arquivo_origem),
      salvarDePara: Boolean(salvar_de_para),
      cellKey: cell_key ? String(cell_key) : undefined,
    });

    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function updateTabelasOcr(req: Request, res: Response) {
  try {
    const filename = String(req.params.filename);
    const { tabelas } = req.body;
    if (!Array.isArray(tabelas)) {
      return res.status(400).json({ error: 'Lista de tabelas inválida' });
    }

    const payload = {
      isEdited: true,
      tables: tabelas,
    };

    await PautaFiscalRepository.updateOcrTables(filename, payload);
    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}


