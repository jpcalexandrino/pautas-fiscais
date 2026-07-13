import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as xlsx from 'xlsx';
import DeParaProdutoEstadoRepository from '../repositories/DeParaProdutoEstadoRepository';
import ProdutoRepository from '../repositories/ProdutoRepository';
import EstadoRepository from '../repositories/EstadoRepository';
import AuditRepository from '../repositories/AuditRepository';

function mapFromDb(row: Record<string, unknown>) {
  return {
    id: row.id,
    uf: row.fk_estado_nk,
    termo_descricao_estado: row.termo_descricao_estado,
    gtin_estado: row.gtin_estado,
    fk_produto: row.fk_produto_sk,
    produto_descricao: row.descricao_interna,
    produto_gtin: row.gtin_13,
    produto_codigo: row.nk_codigo_interno,
    nome_estado: row.nome_estado,
  };
}

function mapToDb(body: Record<string, unknown>) {
  return {
    fk_estado_nk: body.uf as string,
    termo_descricao_estado: body.termo_descricao_estado as string,
    gtin_estado: (body.gtin_estado as string) || null,
    fk_produto_sk: Number(body.fk_produto),
  };
}

export async function getAll(req: Request, res: Response) {
  try {
    const uf = req.query.uf as string | undefined;
    const result = await DeParaProdutoEstadoRepository.getAll(uf);
    res.json(result.rows.map(mapFromDb));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function getById(req: Request, res: Response) {
  try {
    const result = await DeParaProdutoEstadoRepository.getById(Number(req.params.id));
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'De-Para não encontrado' });
    }
    res.json(mapFromDb(result.rows[0]));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function create(req: AuthRequest, res: Response) {
  try {
    const mapped = mapToDb(req.body);
    if (!mapped.fk_estado_nk || !mapped.termo_descricao_estado || !mapped.fk_produto_sk) {
      return res.status(400).json({ error: 'UF, termo e produto são obrigatórios' });
    }
    const result = await DeParaProdutoEstadoRepository.create(mapped);
    const full = await DeParaProdutoEstadoRepository.getById(result.rows[0].id);

    // Fetch product details for audit log
    const productResult = await ProdutoRepository.getById(mapped.fk_produto_sk);
    const product = productResult.rows[0];

    // Audit log
    await AuditRepository.log(req.userId, 'CRIAR_DE_PARA', {
      uf: mapped.fk_estado_nk,
      termo: mapped.termo_descricao_estado,
      produto_id: mapped.fk_produto_sk,
      produto_descricao: product ? product.descricao_interna : null,
      produto_gtin: product ? product.gtin_13 : null
    });

    res.status(201).json(mapFromDb(full.rows[0]));
  } catch (error: unknown) {
    const msg = (error as Error).message;
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return res.status(409).json({ error: 'De-Para já existe para este estado e termo' });
    }
    res.status(500).json({ error: msg });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const mapped = mapToDb(req.body);
    const id = Number(req.params.id);
    const existing = await DeParaProdutoEstadoRepository.getById(id);
    const existingRow = existing.rows[0];

    // Fetch product details for before/after comparison
    let productAnteriorDesc = null;
    let productAnteriorGtin = null;
    if (existingRow) {
      const pAntRes = await ProdutoRepository.getById(Number(existingRow.fk_produto_sk));
      if (pAntRes.rows.length > 0) {
        productAnteriorDesc = pAntRes.rows[0].descricao_interna;
        productAnteriorGtin = pAntRes.rows[0].gtin_13;
      }
    }

    const result = await DeParaProdutoEstadoRepository.update(id, mapped);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'De-Para não encontrado' });
    }
    const full = await DeParaProdutoEstadoRepository.getById(result.rows[0].id);

    const productNovoRes = await ProdutoRepository.getById(mapped.fk_produto_sk);
    const productNovo = productNovoRes.rows[0];

    // Audit log
    await AuditRepository.log(req.userId, 'ATUALIZAR_DE_PARA', {
      id,
      uf: mapped.fk_estado_nk,
      termo: mapped.termo_descricao_estado,
      produto_anterior_id: existingRow ? existingRow.fk_produto_sk : null,
      produto_anterior_descricao: productAnteriorDesc,
      produto_anterior_gtin: productAnteriorGtin,
      produto_novo_id: mapped.fk_produto_sk,
      produto_novo_descricao: productNovo ? productNovo.descricao_interna : null,
      produto_novo_gtin: productNovo ? productNovo.gtin_13 : null
    });

    res.json(mapFromDb(full.rows[0]));
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  try {
    const id = Number(req.params.id);
    const existing = await DeParaProdutoEstadoRepository.getById(id);
    await DeParaProdutoEstadoRepository.delete(id);

    // Audit log
    if (existing.rows.length > 0) {
      const existingRow = existing.rows[0];
      const pRes = await ProdutoRepository.getById(Number(existingRow.fk_produto_sk));
      const p = pRes.rows[0];

      await AuditRepository.log(req.userId, 'EXCLUIR_DE_PARA', {
        id,
        uf: existingRow.fk_estado_nk,
        termo: existingRow.termo_descricao_estado,
        produto_id: existingRow.fk_produto_sk,
        produto_descricao: p ? p.descricao_interna : null,
        produto_gtin: p ? p.gtin_13 : null
      });
    }

    res.status(204).send();
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function bulkImport(req: AuthRequest, res: Response) {
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

    // Mapeamento de cabeçalhos
    const ufKeys = ['uf', 'estado', 'sigla', 'uf_estado', 'uf estado'];
    const termoKeys = [
      'termo_descricao_estado', 'termo', 'termo_descricao', 'descricao_estado',
      'descricao estado', 'termo na pauta', 'termo_pauta', 'termo pauta', 'descricao'
    ];
    const gtinEstadoKeys = [
      'gtin_estado', 'gtin estado', 'gtin_pauta', 'gtin pauta',
      'codigo_barras_estado', 'ean_estado', 'gtin'
    ];
    const productIdKeys = ['id_produto', 'fk_produto', 'sk_produto', 'produto_id', 'produto id', 'id produto'];
    const productCodeKeys = ['codigo_interno_produto', 'codigo_interno', 'codigo interno', 'codigo_erp', 'codigo erp', 'codigo erp produto', 'codigo erp do produto'];
    const productGtinKeys = ['gtin_produto', 'gtin_13', 'gtin_interno', 'ean_produto', 'ean_13', 'gtin produto', 'codigo barras produto', 'gtin'];
    const productDescKeys = ['descricao_produto', 'descricao_interna', 'descricao interna', 'produto', 'nome_produto', 'nome produto', 'descricao do produto'];

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
      const rowNum = i + 2; // Linha física na planilha (2-based considerando cabeçalho na linha 1)

      try {
        const ufRaw = getNormalizedValue(row, ufKeys);
        if (!ufRaw) {
          errors.push({ row: rowNum, error: 'O campo de UF é obrigatório' });
          continue;
        }
        const uf = String(ufRaw).trim().toUpperCase();

        // Validar UF no banco
        const resEstado = await EstadoRepository.getByUf(uf);
        if (resEstado.rows.length === 0) {
          errors.push({ row: rowNum, error: `UF '${uf}' inválida ou não cadastrada no sistema` });
          continue;
        }

        const termoRaw = getNormalizedValue(row, termoKeys);
        if (!termoRaw) {
          errors.push({ row: rowNum, error: 'O termo da pauta do estado é obrigatório' });
          continue;
        }
        const termo = String(termoRaw).trim();

        const gtinEstadoRaw = getNormalizedValue(row, gtinEstadoKeys);
        const gtinEstado = gtinEstadoRaw ? String(gtinEstadoRaw).trim() : null;

        // Tentar identificar o produto interno por diferentes chaves
        let product: any = null;

        const pId = getNormalizedValue(row, productIdKeys);
        if (pId != null && String(pId).trim() !== '') {
          const res = await ProdutoRepository.getById(Number(pId));
          if (res.rows.length > 0) {
            product = res.rows[0];
          }
        }

        if (!product) {
          const pCode = getNormalizedValue(row, productCodeKeys);
          if (pCode != null && String(pCode).trim() !== '') {
            const res = await ProdutoRepository.findByCodigoInterno(String(pCode).trim());
            if (res.rows.length > 0) {
              product = res.rows[0];
            }
          }
        }

        if (!product) {
          const pGtin = getNormalizedValue(row, productGtinKeys);
          if (pGtin != null && String(pGtin).trim() !== '') {
            const res = await ProdutoRepository.findByGtin(String(pGtin).trim());
            if (res.rows.length > 0) {
              product = res.rows[0];
            }
          }
        }

        if (!product) {
          const pDesc = getNormalizedValue(row, productDescKeys);
          if (pDesc != null && String(pDesc).trim() !== '') {
            const res = await ProdutoRepository.findByDescricaoInterna(String(pDesc).trim());
            if (res.rows.length > 0) {
              product = res.rows[0];
            }
          }
        }

        if (!product) {
          errors.push({ row: rowNum, error: 'Nenhum produto interno correspondente foi encontrado por ID, Código ERP, GTIN ou Descrição' });
          continue;
        }

        const fk_produto_sk = product.sk_produto;

        // Verificar se o De-Para já existe para esta UF e Termo
        const existing = await DeParaProdutoEstadoRepository.findByTermo(uf, termo);
        
        const mappedDb = {
          fk_estado_nk: uf,
          termo_descricao_estado: termo,
          gtin_estado: gtinEstado,
          fk_produto_sk: Number(fk_produto_sk)
        };

        if (existing.rows.length > 0) {
          const id = existing.rows[0].id;
          await DeParaProdutoEstadoRepository.update(id, mappedDb);
          updated++;
        } else {
          await DeParaProdutoEstadoRepository.create(mappedDb);
          inserted++;
        }
      } catch (err: unknown) {
        errors.push({ row: rowNum, error: (err as Error).message });
      }
    }

    // Audit log
    await AuditRepository.log(req.userId, 'IMPORTACAO_LOTE_DE_PARA', {
      processedCount: rows.length,
      insertedCount: inserted,
      updatedCount: updated,
      errorCount: errors.length
    });

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
