import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import PautaFiscalService from '../services/PautaFiscalService';
import PautaFiscalRepository from '../repositories/PautaFiscalRepository';
import AuditRepository from '../repositories/AuditRepository';
import ProdutoRepository from '../repositories/ProdutoRepository';
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
    contexto: row.contexto,
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

export async function upload(req: AuthRequest, res: Response) {
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
    const contexto = req.body.contexto || 'proprio';

    const decodedOriginalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    const formattedFilename = (() => {
      const baseName = decodedOriginalName.replace(/\.[^/.]+$/, "").trim();
      return `${uf} - ${formatMonthYear(dataPauta)} - ${baseName}.pdf`;
    })();

    // Verifica se já existe um arquivo com esse nome no banco para evitar duplicatas no mesmo contexto
    const existing = await PautaFiscalRepository.findOcrByFilename(formattedFilename, contexto);
    if (existing.rows.length > 0) {
      const baseName = decodedOriginalName.replace(/\.[^/.]+$/, "").trim();
      return res.status(400).json({
        error: `Uma pauta fiscal para ${uf} na vigência ${formatMonthYear(dataPauta)} no contexto '${contexto}' com o arquivo '${baseName}' já foi cadastrada.`
      });
    }

    const result = await PautaFiscalService.processUpload(
      req.file.buffer,
      formattedFilename,
      uf,
      dataPauta,
      contexto
    );

    // Audit log
    await AuditRepository.log(req.userId, 'IMPORT_ARQUIVO', {
      filename: formattedFilename,
      uf,
      dataPauta,
      contexto
    });

    res.json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getAll(req: AuthRequest, res: Response) {
  try {
    const filters: { fk_estado?: number; fk_produto?: number; contexto?: string } = {};
    if (req.query.fk_estado) filters.fk_estado = Number(req.query.fk_estado);
    if (req.query.fk_produto) filters.fk_produto = Number(req.query.fk_produto);
    if (req.query.contexto) filters.contexto = String(req.query.contexto);

    const result = await PautaFiscalRepository.getAll(filters);
    res.json(result.rows.map(mapPautaFromDb));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

function calculateOcrFileStats(row: any) {
  const { id, filename, uf, data_pauta, confirmed_cells, textract_json, contexto, created_at } = row;
  
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
    contexto,
    created_at,
    total_prices: totalPrices,
    confirmed_count: confirmedCount,
    pending_count: Math.max(0, totalPrices - confirmedCount),
  };
}

export async function getArquivosOcr(req: AuthRequest, res: Response) {
  try {
    const contexto = req.query.contexto ? String(req.query.contexto) : undefined;
    const result = await PautaFiscalRepository.getOcrFiles(contexto);
    const detailed = result.rows.map(calculateOcrFileStats);
    res.json(detailed);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getArquivoOcrByFilename(req: AuthRequest, res: Response) {
  try {
    const filename = String(req.params.filename);
    const contexto = req.query.contexto ? String(req.query.contexto) : 'proprio';
    const result = await PautaFiscalRepository.findOcrByFilename(filename, contexto);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getTabelasOcr(req: AuthRequest, res: Response) {
  try {
    const filename = String(req.params.filename);
    const contexto = req.query.contexto ? String(req.query.contexto) : 'proprio';
    const result = await PautaFiscalRepository.findOcrByFilename(filename, contexto);
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

export async function confirmarManual(req: AuthRequest, res: Response) {
  try {
    const { fk_produto, fk_produtos, uf, descricao_estado, valor_pauta, data_pauta, arquivo_origem, salvar_de_para, cell_key, contexto } = req.body;
    if ((!fk_produto && !fk_produtos) || !uf || !descricao_estado || valor_pauta === undefined || !data_pauta || !arquivo_origem) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    const ids = fk_produtos ? fk_produtos.map(Number) : [Number(fk_produto)];
    const ctx = contexto || 'proprio';

    const result = await PautaFiscalService.confirmManual({
      fk_produtos: ids,
      uf: String(uf),
      descricao_estado: String(descricao_estado),
      valor_pauta: Number(valor_pauta),
      data_pauta: String(data_pauta),
      arquivo_origem: String(arquivo_origem),
      salvarDePara: Boolean(salvar_de_para),
      cellKey: cell_key ? String(cell_key) : undefined,
      contexto: ctx
    });

    // Fetch product details for detailed audit log
    const productNames: string[] = [];
    for (const id of ids) {
      const pRes = await ProdutoRepository.getById(id);
      if (pRes.rows.length > 0) {
        const p = pRes.rows[0];
        productNames.push(`${p.descricao_interna}${p.gtin_13 ? ` (GTIN: ${p.gtin_13})` : ''}`);
      }
    }

    // Audit log - apenas registra se houve inserção ou atualização real de preços
    const hasChanges = result.results.some(r => r.status === 'inserted' || r.status === 'updated');
    if (hasChanges) {
      await AuditRepository.log(req.userId, 'ASSOCIACAO_PRODUTO', {
        produtos: ids,
        produtos_descritores: productNames,
        uf,
        descricao_estado,
        valor_pauta,
        arquivo_origem,
        contexto: ctx,
        salvouDePara: Boolean(salvar_de_para),
        alteracoes: result.results
      });
    }

    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}
export async function updateTabelasOcr(req: AuthRequest, res: Response) {
  try {
    const filename = String(req.params.filename);
    const contexto = req.body.contexto || 'proprio';
    const { tabelas, confirmedCells } = req.body;
    if (!Array.isArray(tabelas)) {
      return res.status(400).json({ error: 'Lista de tabelas inválida' });
    }

    // Comparison for detailed audit logs
    const existingResult = await PautaFiscalRepository.findOcrByFilename(filename, contexto);
    const diffs: string[] = [];

    if (existingResult.rows.length > 0) {
      const oldOcr = existingResult.rows[0];
      const oldRaw = oldOcr.textract_json;
      const oldTables = (oldRaw && typeof oldRaw === 'object' && 'tables' in oldRaw)
        ? (oldRaw as any).tables
        : [];

      if (Array.isArray(oldTables) && oldTables.length > 0) {
        for (const newTab of tabelas) {
          const oldTab = oldTables.find((t: any) => t.tabelaIndex === newTab.tabelaIndex);
          if (!oldTab) {
            diffs.push(`Adicionou tabela ${newTab.tabelaIndex}`);
            continue;
          }

          // Compare headers
          const headersChanged = JSON.stringify(oldTab.headers) !== JSON.stringify(newTab.headers);
          if (headersChanged) {
            diffs.push(`Tabela ${newTab.tabelaIndex}: Cabeçalhos de [${oldTab.headers.join(', ')}] para [${newTab.headers.join(', ')}]`);
          }

          // Compare rows
          const oldRows = oldTab.rows || [];
          const newRows = newTab.rows || [];

          const maxRows = Math.max(oldRows.length, newRows.length);
          for (let r = 0; r < maxRows; r++) {
            const oldR = oldRows[r];
            const newR = newRows[r];

            if (!oldR && newR) {
              diffs.push(`Tabela ${newTab.tabelaIndex}, L${r + 1}: Adicionou linha [${newR.join(', ')}]`);
            } else if (oldR && !newR) {
              diffs.push(`Tabela ${newTab.tabelaIndex}, L${r + 1}: Removeu linha [${oldR.join(', ')}]`);
            } else if (oldR && newR) {
              const maxCols = Math.max(oldR.length, newR.length);
              for (let c = 0; c < maxCols; c++) {
                const oldVal = (oldR[c] || '').trim();
                const newVal = (newR[c] || '').trim();
                if (oldVal !== newVal) {
                  const colName = newTab.headers[c] || `C${c + 1}`;
                  diffs.push(`Tabela ${newTab.tabelaIndex}, L${r + 1}, col "${colName}": "${oldVal}" ➔ "${newVal}"`);
                }
              }
            }
          }
        }
      } else {
        diffs.push('Estrutura de tabelas inicial atualizada');
      }
    }

    const payload = {
      isEdited: true,
      tables: tabelas,
    };

    await PautaFiscalRepository.updateOcrTables(filename, payload, confirmedCells, contexto);
    await AuditRepository.log(req.userId, 'ATUALIZACAO_TABELA_OCR', {
      filename,
      contexto,
      alteracoes: diffs.slice(0, 100),
      total_alteracoes: diffs.length
    });

    res.json({ success: true });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}
