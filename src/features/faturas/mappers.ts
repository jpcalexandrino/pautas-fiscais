/**
 * Mappers entre o modelo do banco de dados (snake_case)
 * e o modelo do front-end (camelCase).
 */

import type { FaturaRow } from './types';

const DB_TO_JS_MAP: Record<string, string> = {
  nome_do_site: 'nomeDoSite',
  nome_do_cliente: 'nomeDoCliente',
  fonte: 'fonte',
  modalidade_tarifaria: 'modalidadeTarifaria',
  data_insercao: 'dataInsercao',
  nome_concessionaria: 'nomeConcessionaria',
  cnpj_concessionaria: 'cnpjConcessionaria',
  endereco: 'endereco',
  cep: 'cep',
  cidade: 'cidade',
  uf: 'uf',
  cnpj: 'cnpj',
  impostos_rs: 'impostosRS',
  instalacao: 'instalacao',
  mes_referencia: 'mesReferencia',
  data_leitura_atualizada: 'dataLeituraAtualizada',
  data_leitura_anterior: 'dataLeituraAnterior',
  data_leitura_proxima: 'dataLeituraProxima',
  mes_consumo: 'mesConsumo',
  data_vencimento: 'dataVencimento',
  data_emissao: 'dataEmissao',
  valor_total_rs: 'valorTotalRS',
  classe: 'classe',
  subclasse: 'subClasse',
  subgrupo: 'subgrupo',
  codigo_barras: 'codigoBarras',
  numero_nf: 'numeroNF',
  consumo_tusd_fora_ponta_rs: 'consumoTUSDForaPontaRS',
  tarifa_consumo_tusd_fora_ponta: 'tarifaConsumoTUSDForaPonta',
  medida_consumo_tusd_fora_ponta: 'medidaConsumoTUSDForaPonta',
  consumo_te_fora_ponta_rs: 'consumoTEForaPontaRS',
  tarifa_consumo_te_fora_ponta: 'tarifaConsumoTEForaPonta',
  medida_consumo_te_fora_ponta: 'medidaConsumoTEForaPonta',
  consumo_te_adicional_bandeira_amarela_rs: 'consumoTEAdicionalBandeiraAmarelaRS',
  tarifa_consumo_te_adicional_bandeira_amarela: 'tarifaConsumoTEAdicionalBandeiraAmarela',
  medida_consumo_te_adicional_bandeira_amarela: 'medidaConsumoTEAdicionalBandeiraAmarela',
  multa_rs: 'multaRS',
  juros_mora_rs: 'jurosMoraRS',
  atualizacao_monetaria_rs: 'atualizacao_monetaria_rs',
  ressarcimento_rs: 'ressarcimentoRS',
  outros_rs: 'outrosRS',
  aliquota_icms: 'aliquotaICMS',
  base_calculo_icms_rs: 'baseCalculoICMSRS',
  custo_icms_rs: 'custoICMSRS',
  aliquota_cofins: 'aliquotaCOFINS',
  base_calculo_cofins_rs: 'baseCalculoCOFINSRS',
  custo_cofins_rs: 'custoCOFINSRS',
  aliquota_pis_pasep: 'aliquotaPISPASEP',
  base_calculo_pis_pasep_rs: 'baseCalculoPISPASEPRS',
  custo_pis_pasep_rs: 'custoPISPASEPRS',
  servicos_iluminacao_publica_rs: 'servicosIluminacaoPublicaRS',
  tarifa_servicos_iluminacao_publica: 'tarifaServicosIluminacaoPublica',
  medida_servicos_iluminacao_publica: 'medidaServicosIluminacaoPublica',
};

const JS_TO_DB_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DB_TO_JS_MAP).map(([dbKey, jsKey]) => [jsKey, dbKey])
);

// Corrige casos onde o mapeamento reverso não é 1:1
JS_TO_DB_MAP['subClasse'] = 'subclasse';
JS_TO_DB_MAP['atualizacaoMonetariaRS'] = 'atualizacao_monetaria_rs';

const NUMERIC_PREFIXES = ['RS', 'tarifa', 'medida', 'aliquota', 'base', 'custo'];

function isNumericField(jsKey: string): boolean {
  return NUMERIC_PREFIXES.some(prefix =>
    jsKey.endsWith(prefix) || jsKey.startsWith(prefix.toLowerCase())
  );
}

/**
 * Mapeia uma linha do banco de dados (snake_case) para o modelo do front (camelCase)
 */
export function mapFromDb(dbRow: any): FaturaRow {
  const mapped: any = { id: dbRow.sk_fatura };
  for (const [dbKey, jsKey] of Object.entries(DB_TO_JS_MAP)) {
    let value = dbRow[dbKey];
    if (isNumericField(jsKey)) {
      value = parseFloat(value) || 0;
    }
    mapped[jsKey] = value;
  }
  return mapped as FaturaRow;
}

/**
 * Mapeia uma linha do front (camelCase) para o modelo do banco (snake_case)
 */
export function mapToDb(jsRow: FaturaRow): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  for (const [jsKey, dbKey] of Object.entries(JS_TO_DB_MAP)) {
    mapped[dbKey] = jsRow[jsKey as keyof FaturaRow];
  }
  return mapped;
}
