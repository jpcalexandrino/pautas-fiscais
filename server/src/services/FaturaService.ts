import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parseNumericValue, sanitizeText, formatDateOnly } from '../utils/parsers';
import FaturaRepository from '../repositories/FaturaRepository';
import ClientRepository from '../repositories/ClientRepository';

export interface ProcessResult {
  message: string;
  count: number;
  rows?: any[];
}

class FaturaService {
  async processFile(buffer: Buffer, fileName: string): Promise<any[]> {
    const extension = fileName.split('.').pop()?.toLowerCase();
    let rows: any[] = [];

    if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        dateNF: 'yyyy-mm-dd'
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null });
      
      rows = (rawRows as any[]).map(row => {
        const trimmedRow: any = {};
        for (const key in row) {
          trimmedRow[String(key).trim()] = row[key];
        }
        return trimmedRow;
      });
    } else if (extension === 'csv') {
      const csvData = buffer.toString('utf8');
      const results = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header: string) => header.trim(),
      });
      rows = results.data;
      
      const requiredHeaders = ['Nome do Site', 'Instalação', 'Valor Total R$', 'Mês de Referência', 'CNPJ'];
      const csvHeaders = results.meta.fields || [];
      const matchedHeaders = requiredHeaders.filter(h => csvHeaders.includes(h));

      if (matchedHeaders.length < 3) {
        throw new Error('Arquivo CSV inválido ou corrompido. Excel costuma corromper números longos em CSV. Tente subir o arquivo original em formato .XLSX.');
      }
    } else {
      throw new Error('Formato de arquivo não suportado. Use .CSV, .XLSX ou .XLS');
    }

    if (rows.length === 0) {
      throw new Error('Arquivo vazio ou sem dados válidos.');
    }

    const sanitizedRows: any[] = [];
    for (const row of rows) {
      const mappedFatura = {
        nome_do_site: sanitizeText(row['Nome do Site']),
        nome_do_cliente: sanitizeText(row['Nome do Cliente']),
        fonte: sanitizeText(row['Fonte']),
        modalidade_tarifaria: sanitizeText(row['Modalidade Tarifária'] || row['ModalidadeTarifária'] || row['ModalidadeTarifaria']),
        data_insercao: formatDateOnly(row['Data Inserção']),
        nome_concessionaria: sanitizeText(row['Nome da Concessionária/Comercializadora']),
        cnpj_concessionaria: sanitizeText(row['CNPJ da Concessionária/Comercializadora']),
        endereco: sanitizeText(row['Endereço']),
        cep: sanitizeText(row['CEP']),
        cidade: sanitizeText(row['Cidade']),
        uf: sanitizeText(row['UF']),
        cnpj: sanitizeText(row['CNPJ']),
        impostos_rs: parseNumericValue(row['Impostos R$']),
        instalacao: sanitizeText(row['Instalação']),
        mes_referencia: sanitizeText(row['Mês de Referência']),
        data_leitura_atualizada: formatDateOnly(row['Data leitura atualizada']),
        data_leitura_anterior: formatDateOnly(row['Data leitura anterior']),
        data_leitura_proxima: formatDateOnly(row['Data leitura próxima']),
        mes_consumo: sanitizeText(row['Mês de Consumo']),
        data_vencimento: formatDateOnly(row['Data de vencimento']),
        data_emissao: formatDateOnly(row['Data Emissão']),
        valor_total_rs: parseNumericValue(row['Valor Total R$']),
        classe: sanitizeText(row['Classe']),
        subclasse: sanitizeText(row['SubClasse']),
        subgrupo: sanitizeText(row['Subgrupo']),
        codigo_barras: sanitizeText(row['Código de barras']),
        numero_nf: sanitizeText(row['Número da NF']),
        consumo_tusd_fora_ponta_rs: parseNumericValue(row['Consumo TUSD - Fora Ponta R$']),
        tarifa_consumo_tusd_fora_ponta: parseNumericValue(row['Tarifa Consumo TUSD - Fora Ponta']),
        medida_consumo_tusd_fora_ponta: parseNumericValue(row['Medida Consumo TUSD - Fora Ponta']),
        consumo_te_fora_ponta_rs: parseNumericValue(row['Consumo TE - Fora Ponta R$']),
        tarifa_consumo_te_fora_ponta: parseNumericValue(row['Tarifa Consumo TE - Fora Ponta']),
        medida_consumo_te_fora_ponta: parseNumericValue(row['Medida Consumo TE - Fora Ponta']),
        consumo_te_adicional_bandeira_amarela_rs: parseNumericValue(row['Consumo TE - Adicional Bandeira Amarela R$']),
        tarifa_consumo_te_adicional_bandeira_amarela: parseNumericValue(row['Tarifa Consumo TE - Adicional Bandeira Amarela']),
        medida_consumo_te_adicional_bandeira_amarela: parseNumericValue(row['Medida Consumo TE - Adicional Bandeira Amarela']),
        multa_rs: parseNumericValue(row['Multa R$'] || row['Multa por Atraso Pgto'] || row['Multa']),
        juros_mora_rs: parseNumericValue(row['Juros de Mora R$'] || row['Juros de Mora'] || row['Juros']),
        atualizacao_monetaria_rs: parseNumericValue(row['Atualização Monetária R$'] || row['Atualização Monetária'] || row['Atualização']),
        ressarcimento_rs: parseNumericValue(row['Ressarcimento R$']),
        outros_rs: parseNumericValue(row['Outros R$']),
        aliquota_icms: parseNumericValue(row['Alíquota - ICMS']),
        base_calculo_icms_rs: parseNumericValue(row['Base de cálculo - ICMS R$']),
        custo_icms_rs: parseNumericValue(row['Custo - ICMS R$']),
        aliquota_cofins: parseNumericValue(row['Alíquota - COFINS']),
        base_calculo_cofins_rs: parseNumericValue(row['Base de cálculo - COFINS R$']),
        custo_cofins_rs: parseNumericValue(row['Custo - COFINS R$']),
        aliquota_pis_pasep: parseNumericValue(row['Alíquota - PIS/PASEP']),
        base_calculo_pis_pasep_rs: parseNumericValue(row['Base de cálculo - PIS/PASEP R$']),
        custo_pis_pasep_rs: parseNumericValue(row['Custo - PIS/PASEP R$']),
        servicos_iluminacao_publica_rs: parseNumericValue(row['Serviços - Iluminação Pública R$']),
        tarifa_servicos_iluminacao_publica: parseNumericValue(row['Tarifa Serviços - Iluminação Pública']),
        medida_servicos_iluminacao_publica: parseNumericValue(row['Medida Serviços - Iluminação Pública']),
      };
      sanitizedRows.push(mappedFatura);
    }

    return sanitizedRows;
  }

  private normalizeMonth(val: string | null | undefined): string {
    if (!val) return '';
    const clean = String(val).trim().split(' ')[0];
    const parts = clean.split(/[/-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[1]}/${parts[0]}`;
      }
      return `${parts[1]}/${parts[2]}`;
    }
    if (parts.length === 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return clean;
  }

  private getNumericValue(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(String(value).replace(',', '.').trim());
    return Number.isFinite(num) ? num : 0;
  }

  private isSameFatura(fatura: any, existing: any): boolean {
    if (this.normalizeMonth(fatura.mes_referencia) !== this.normalizeMonth(existing.mes_referencia)) {
      return false;
    }

    if (this.normalizeMonth(fatura.mes_consumo) !== this.normalizeMonth(existing.mes_consumo)) {
      return false;
    }

    const numericFields = [
      'valor_total_rs', 'consumo_tusd_fora_ponta_rs', 'tarifa_consumo_tusd_fora_ponta',
      'medida_consumo_tusd_fora_ponta', 'consumo_te_fora_ponta_rs',
      'tarifa_consumo_te_fora_ponta', 'medida_consumo_te_fora_ponta',
      'consumo_te_adicional_bandeira_amarela_rs', 'tarifa_consumo_te_adicional_bandeira_amarela',
      'medida_consumo_te_adicional_bandeira_amarela', 'multa_rs', 'ressarcimento_rs', 'outros_rs', 'aliquota_icms',
      'base_calculo_icms_rs', 'custo_icms_rs', 'aliquota_cofins', 'base_calculo_cofins_rs',
      'custo_cofins_rs', 'aliquota_pis_pasep', 'base_calculo_pis_pasep_rs',
      'custo_pis_pasep_rs', 'servicos_iluminacao_publica_rs',
      'tarifa_servicos_iluminacao_publica', 'medida_servicos_iluminacao_publica'
    ]; 

    for (const field of numericFields) {
      const left = this.getNumericValue(fatura[field]);
      const right = this.getNumericValue(existing[field]);
      if (left !== right) {
        return false;
      }
    }

    return true;
  }

  async saveOrUpdateFatura(fatura: any): Promise<'inserted' | 'ignored' | 'replaced'> {
    if (fatura.instalacao) {
      try {
        const clientRes = await ClientRepository.findByUcOrCnpj(fatura.instalacao);
        if (clientRes.rows.length > 0) {
          const client = clientRes.rows[0];
          fatura.nome_do_site = client.nome;
          fatura.nome_do_cliente = client.nome;
        }
      } catch (error) {
        console.error('Erro ao buscar cliente para padronizar o nome:', error);
      }
    }

    const matches = await FaturaRepository.findActiveMatches(
      fatura.instalacao,
      fatura.mes_referencia,
      fatura.numero_nf || ''
    );

    if (matches.length === 0) {
      await FaturaRepository.insert(fatura);
      return 'inserted';
    }

    const existing = matches[0];
    if (this.isSameFatura(fatura, existing)) {
      return 'ignored';
    }

    const idsToDelete = matches
      .map(match => Number(match.sk_fatura))
      .filter(id => Number.isFinite(id));

    if (idsToDelete.length > 0) {
      await FaturaRepository.softDeleteByIds(idsToDelete);
    }

    await FaturaRepository.insert(fatura);
    return 'replaced';
  }

  async saveFaturas(faturas: any[]): Promise<number> {
    let count = 0;
    for (const fatura of faturas) {
      const sanitizedFatura = {
        nome_do_site: sanitizeText(fatura.nome_do_site),
        nome_do_cliente: sanitizeText(fatura.nome_do_cliente),
        fonte: sanitizeText(fatura.fonte),
        modalidade_tarifaria: sanitizeText(fatura.modalidade_tarifaria),
        data_insercao: formatDateOnly(fatura.data_insercao),
        nome_concessionaria: sanitizeText(fatura.nome_concessionaria),
        cnpj_concessionaria: sanitizeText(fatura.cnpj_concessionaria),
        endereco: sanitizeText(fatura.endereco),
        cep: sanitizeText(fatura.cep),
        cidade: sanitizeText(fatura.cidade),
        uf: sanitizeText(fatura.uf),
        cnpj: sanitizeText(fatura.cnpj),
        impostos_rs: parseNumericValue(fatura.impostos_rs),
        instalacao: sanitizeText(fatura.instalacao),
        mes_referencia: sanitizeText(fatura.mes_referencia),
        data_leitura_atualizada: formatDateOnly(fatura.data_leitura_atualizada),
        data_leitura_anterior: formatDateOnly(fatura.data_leitura_anterior),
        data_leitura_proxima: formatDateOnly(fatura.data_leitura_proxima),
        mes_consumo: sanitizeText(fatura.mes_consumo),
        data_vencimento: formatDateOnly(fatura.data_vencimento),
        data_emissao: formatDateOnly(fatura.data_emissao),
        valor_total_rs: parseNumericValue(fatura.valor_total_rs),
        classe: sanitizeText(fatura.classe),
        subclasse: sanitizeText(fatura.subclasse),
        subgrupo: sanitizeText(fatura.subgrupo),
        codigo_barras: sanitizeText(fatura.codigo_barras),
        numero_nf: sanitizeText(fatura.numero_nf),
        consumo_tusd_fora_ponta_rs: parseNumericValue(fatura.consumo_tusd_fora_ponta_rs),
        tarifa_consumo_tusd_fora_ponta: parseNumericValue(fatura.tarifa_consumo_tusd_fora_ponta),
        medida_consumo_tusd_fora_ponta: parseNumericValue(fatura.medida_consumo_tusd_fora_ponta),
        consumo_te_fora_ponta_rs: parseNumericValue(fatura.consumo_te_fora_ponta_rs),
        tarifa_consumo_te_fora_ponta: parseNumericValue(fatura.tarifa_consumo_te_fora_ponta),
        medida_consumo_te_fora_ponta: parseNumericValue(fatura.medida_consumo_te_fora_ponta),
        consumo_te_adicional_bandeira_amarela_rs: parseNumericValue(fatura.consumo_te_adicional_bandeira_amarela_rs),
        tarifa_consumo_te_adicional_bandeira_amarela: parseNumericValue(fatura.tarifa_consumo_te_adicional_bandeira_amarela),
        medida_consumo_te_adicional_bandeira_amarela: parseNumericValue(fatura.medida_consumo_te_adicional_bandeira_amarela),
        multa_rs: parseNumericValue(fatura.multa_rs),
        juros_mora_rs: parseNumericValue(fatura.juros_mora_rs),
        atualizacao_monetaria_rs: parseNumericValue(fatura.atualizacao_monetaria_rs),
        ressarcimento_rs: parseNumericValue(fatura.ressarcimento_rs),
        outros_rs: parseNumericValue(fatura.outros_rs),
        aliquota_icms: parseNumericValue(fatura.aliquota_icms),
        base_calculo_icms_rs: parseNumericValue(fatura.base_calculo_icms_rs),
        custo_icms_rs: parseNumericValue(fatura.custo_icms_rs),
        aliquota_cofins: parseNumericValue(fatura.aliquota_cofins),
        base_calculo_cofins_rs: parseNumericValue(fatura.base_calculo_cofins_rs),
        custo_cofins_rs: parseNumericValue(fatura.custo_cofins_rs),
        aliquota_pis_pasep: parseNumericValue(fatura.aliquota_pis_pasep),
        base_calculo_pis_pasep_rs: parseNumericValue(fatura.base_calculo_pis_pasep_rs),
        custo_pis_pasep_rs: parseNumericValue(fatura.custo_pis_pasep_rs),
        servicos_iluminacao_publica_rs: parseNumericValue(fatura.servicos_iluminacao_publica_rs),
        tarifa_servicos_iluminacao_publica: parseNumericValue(fatura.tarifa_servicos_iluminacao_publica),
        medida_servicos_iluminacao_publica: parseNumericValue(fatura.medida_servicos_iluminacao_publica),
      };

      const status = await this.saveOrUpdateFatura(sanitizedFatura);
      if (status === 'inserted' || status === 'replaced') {
        count++;
      }
    }
    return count;
  }
}

export default new FaturaService();
