import { Request, Response } from 'express';
import * as xlsx from 'xlsx';
import ProdutoRepository from '../repositories/ProdutoRepository';

function mapFromDb(row: Record<string, unknown>) {
  return {
    id: row.sk_produto,
    codigo_interno: row.nk_codigo_interno,
    gtin_13: row.gtin_13,
    descricao_interna: row.descricao_interna,
    embalagem: row.embalagem,
    conteudo_volume: row.conteudo_volume,
    created_at: row.created_at,
  };
}

function mapToDb(body: Record<string, unknown>) {
  return {
    nk_codigo_interno: body.codigo_interno as string,
    gtin_13: body.gtin_13 as string,
    descricao_interna: body.descricao_interna as string,
    embalagem: body.embalagem as string,
    conteudo_volume: body.conteudo_volume != null ? Number(body.conteudo_volume) : undefined,
  };
}

export async function getAll(_req: Request, res: Response) {
  try {
    const result = await ProdutoRepository.getAll();
    res.json(result.rows.map(mapFromDb));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const result = await ProdutoRepository.getById(Number(req.params.id));
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(mapFromDb(result.rows[0]));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const mapped = mapToDb(req.body);
    if (!mapped.descricao_interna) {
      return res.status(400).json({ error: 'Descrição interna é obrigatória' });
    }
    if (mapped.gtin_13) {
      const existing = await ProdutoRepository.findByGtin(mapped.gtin_13);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'GTIN já cadastrado' });
      }
    }
    const result = await ProdutoRepository.create(mapped);
    res.status(201).json(mapFromDb(result.rows[0]));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const mapped = mapToDb(req.body);
    if (mapped.gtin_13) {
      const existing = await ProdutoRepository.findByGtinExcludingId(id, mapped.gtin_13);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'GTIN já cadastrado em outro produto' });
      }
    }
    const result = await ProdutoRepository.update(id, mapped);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json(mapFromDb(result.rows[0]));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await ProdutoRepository.delete(Number(req.params.id));
    res.status(204).send();
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function bulkImport(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Ler arquivo Excel do buffer
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ error: 'Planilha vazia ou inválida' });
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'A planilha não contém linhas de dados' });
    }

    // Mapeamento de cabeçalhos de coluna comuns
    const codigoKeys = ['codigo_interno', 'codigo interno', 'codigo erp', 'codigo', 'cod', 'erp', 'nk_codigo_interno'];
    const gtinKeys = ['gtin_13', 'gtin13', 'gtin', 'ean', 'ean_13', 'ean13', 'codigo_barras', 'codigo de barras', 'cod barras', 'cod_barras'];
    const descricaoKeys = ['descricao_interna', 'descricao interna', 'descricao', 'produto', 'nome', 'descricao_comercial'];
    const embalagemKeys = ['embalagem', 'tipo embalagem', 'emb'];
    const volumeKeys = ['conteudo_volume', 'conteudo volume', 'conteudo', 'volume', 'peso', 'quantidade', 'qtd'];

    function getNormalizedValue(row: Record<string, any>, keys: string[]): any {
      for (const k of Object.keys(row)) {
        const normK = k.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (keys.includes(normK)) {
          return row[k];
        }
      }
      return undefined;
    }

    let inserted = 0;
    let updated = 0;
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Número da linha (1-based + 1 para o cabeçalho)

      try {
        const descricaoRaw = getNormalizedValue(row, descricaoKeys);
        if (!descricaoRaw) {
          errors.push({ row: rowNum, error: 'Descrição interna do produto é obrigatória' });
          continue;
        }

        const descricao = String(descricaoRaw).trim();
        const codigoRaw = getNormalizedValue(row, codigoKeys);
        const codigo = codigoRaw ? String(codigoRaw).trim() : undefined;

        const gtinRaw = getNormalizedValue(row, gtinKeys);
        const gtin = gtinRaw ? String(gtinRaw).trim() : undefined;

        const embalagemRaw = getNormalizedValue(row, embalagemKeys);
        const embalagem = embalagemRaw ? String(embalagemRaw).trim() : undefined;

        const volumeRaw = getNormalizedValue(row, volumeKeys);
        let volume: number | undefined = undefined;
        if (volumeRaw !== undefined && volumeRaw !== null && volumeRaw !== '') {
          const parsedVolume = Number(volumeRaw);
          if (!isNaN(parsedVolume)) {
            volume = parsedVolume;
          }
        }

        // Buscar se já existe produto cadastrado
        let existingProduct: any = null;

        if (gtin) {
          const resGtin = await ProdutoRepository.findByGtin(gtin);
          if (resGtin.rows.length > 0) {
            existingProduct = resGtin.rows[0];
          }
        }

        if (!existingProduct && codigo) {
          const resCod = await ProdutoRepository.findByCodigoInterno(codigo);
          if (resCod.rows.length > 0) {
            existingProduct = resCod.rows[0];
          }
        }

        const mapped = {
          nk_codigo_interno: codigo || (existingProduct ? existingProduct.nk_codigo_interno : null),
          gtin_13: gtin || (existingProduct ? existingProduct.gtin_13 : null),
          descricao_interna: descricao,
          embalagem: embalagem !== undefined ? embalagem : (existingProduct ? existingProduct.embalagem : null),
          conteudo_volume: volume !== undefined ? volume : (existingProduct ? existingProduct.conteudo_volume : null),
        };

        if (existingProduct) {
          // Se o novo gtin for diferente do atual, validar se não colide com outro produto
          if (gtin && gtin !== existingProduct.gtin_13) {
            const conflictGtin = await ProdutoRepository.findByGtinExcludingId(existingProduct.sk_produto, gtin);
            if (conflictGtin.rows.length > 0) {
              errors.push({ row: rowNum, error: `GTIN '${gtin}' já cadastrado em outro produto` });
              continue;
            }
          }

          await ProdutoRepository.update(existingProduct.sk_produto, mapped);
          updated++;
        } else {
          // Garantir que o GTIN não existe
          if (gtin) {
            const conflictGtin = await ProdutoRepository.findByGtin(gtin);
            if (conflictGtin.rows.length > 0) {
              errors.push({ row: rowNum, error: `GTIN '${gtin}' já cadastrado` });
              continue;
            }
          }

          await ProdutoRepository.create(mapped);
          inserted++;
        }
      } catch (err: unknown) {
        errors.push({ row: rowNum, error: (err as Error).message });
      }
    }

    res.json({
      success: true,
      processed: rows.length,
      inserted,
      updated,
      errors,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export { remove as delete };

