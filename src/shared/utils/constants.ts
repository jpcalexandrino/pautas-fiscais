/**
 * Constantes globais do sistema EnergyDoc
 * Variáveis reutilizáveis em todos os componentes
 */

export interface AppConfig {
  name: string;
  version: string;
  description: string;
  locale: string;
  currency: string;
}

export const APP_CONFIG: AppConfig = {
  name: 'Audit Energy',
  version: '1.0.0',
  description: 'Sistema de Análise de Faturas de Energia Elétrica',
  locale: 'pt-BR',
  currency: 'BRL',
};

export interface CsvField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'currency' | 'number' | 'percentage';
}

/** Campos esperados no CSV/XLSX */
export const CSV_FIELDS: CsvField[] = [
  { key: 'nomeDoSite', label: 'Nome do Site', type: 'text' },
  { key: 'nomeDoCliente', label: 'Nome do Cliente', type: 'text' },
  { key: 'fonte', label: 'Fonte', type: 'text' },
  { key: 'modalidadeTarifaria', label: 'Modalidade Tarifária', type: 'text' },
  { key: 'dataInsercao', label: 'Data Inserção', type: 'date' },
  { key: 'nomeConcessionaria', label: 'Nome da Concessionária/Comercializadora', type: 'text' },
  { key: 'cnpjConcessionaria', label: 'CNPJ da Concessionária/Comercializadora', type: 'text' },
  { key: 'endereco', label: 'Endereço', type: 'text' },
  { key: 'cep', label: 'CEP', type: 'text' },
  { key: 'cidade', label: 'Cidade', type: 'text' },
  { key: 'uf', label: 'UF', type: 'text' },
  { key: 'cnpj', label: 'CNPJ', type: 'text' },
  { key: 'impostosRS', label: 'Impostos R$', type: 'currency' },
  { key: 'instalacao', label: 'Instalação', type: 'text' },
  { key: 'mesReferencia', label: 'Mês de Referência', type: 'text' },
  { key: 'dataLeituraAtualizada', label: 'Data leitura atualizada', type: 'date' },
  { key: 'dataLeituraAnterior', label: 'Data leitura anterior', type: 'date' },
  { key: 'dataLeituraProxima', label: 'Data leitura próxima', type: 'date' },
  { key: 'mesConsumo', label: 'Mês de Consumo', type: 'text' },
  { key: 'dataVencimento', label: 'Data de vencimento', type: 'date' },
  { key: 'dataEmissao', label: 'Data Emissão', type: 'date' },
  { key: 'valorTotalRS', label: 'Valor Total R$', type: 'currency' },
  { key: 'classe', label: 'Classe', type: 'text' },
  { key: 'subClasse', label: 'SubClasse', type: 'text' },
  { key: 'subgrupo', label: 'Subgrupo', type: 'text' },
  { key: 'codigoBarras', label: 'Código de barras', type: 'text' },
  { key: 'numeroNF', label: 'Número da NF', type: 'text' },
  { key: 'consumoTUSDForaPontaRS', label: 'Consumo TUSD - Fora Ponta R$', type: 'currency' },
  { key: 'tarifaConsumoTUSDForaPonta', label: 'Tarifa Consumo TUSD - Fora Ponta', type: 'number' },
  { key: 'medidaConsumoTUSDForaPonta', label: 'Medida Consumo TUSD - Fora Ponta', type: 'number' },
  { key: 'consumoTEForaPontaRS', label: 'Consumo TE - Fora Ponta R$', type: 'currency' },
  { key: 'tarifaConsumoTEForaPonta', label: 'Tarifa Consumo TE - Fora Ponta', type: 'number' },
  { key: 'medidaConsumoTEForaPonta', label: 'Medida Consumo TE - Fora Ponta', type: 'number' },
  { key: 'consumoTEAdicionalBandeiraAmarelaRS', label: 'Consumo TE - Adicional Bandeira Amarela R$', type: 'currency' },
  { key: 'tarifaConsumoTEAdicionalBandeiraAmarela', label: 'Tarifa Consumo TE - Adicional Bandeira Amarela', type: 'number' },
  { key: 'medidaConsumoTEAdicionalBandeiraAmarela', label: 'Medida Consumo TE - Adicional Bandeira Amarela', type: 'number' },
  { key: 'multaRS', label: 'Multa R$', type: 'currency' },
  { key: 'ressarcimentoRS', label: 'Ressarcimento R$', type: 'currency' },
  { key: 'outrosRS', label: 'Outros R$', type: 'currency' },
  { key: 'aliquotaICMS', label: 'Alíquota - ICMS', type: 'percentage' },
  { key: 'baseCalculoICMSRS', label: 'Base de cálculo - ICMS R$', type: 'currency' },
  { key: 'custoICMSRS', label: 'Custo - ICMS R$', type: 'currency' },
  { key: 'aliquotaCOFINS', label: 'Alíquota - COFINS', type: 'percentage' },
  { key: 'baseCalculoCOFINSRS', label: 'Base de cálculo - COFINS R$', type: 'currency' },
  { key: 'custoCOFINSRS', label: 'Custo - COFINS R$', type: 'currency' },
  { key: 'aliquotaPISPASEP', label: 'Alíquota - PIS/PASEP', type: 'percentage' },
  { key: 'baseCalculoPISPASEPRS', label: 'Base de cálculo - PIS/PASEP R$', type: 'currency' },
  { key: 'custoPISPASEPRS', label: 'Custo - PIS/PASEP R$', type: 'currency' },
  { key: 'servicosIluminacaoPublicaRS', label: 'Serviços - Iluminação Pública R$', type: 'currency' },
  { key: 'tarifaServicosIluminacaoPublica', label: 'Tarifa Serviços - Iluminação Pública', type: 'number' },
  { key: 'medidaServicosIluminacaoPublica', label: 'Medida Serviços - Iluminação Pública', type: 'number' },
];

/** Mapeamento nome CSV header → chave interna */
export const CSV_HEADER_MAP: Record<string, string> = {
  'Nome do Site': 'nomeDoSite',
  'Nome do Cliente': 'nomeDoCliente',
  'Fonte': 'fonte',
  'ModalidadeTarifária': 'modalidadeTarifaria',
  'ModalidadeTarifaria': 'modalidadeTarifaria',
  'Data Inserção': 'dataInsercao',
  'Nome da Concessionária/Comercializadora': 'nomeConcessionaria',
  'CNPJ da Concessionária/Comercializadora': 'cnpjConcessionaria',
  'Endereço': 'endereco',
  'CEP': 'cep',
  'Cidade': 'cidade',
  'UF': 'uf',
  'CNPJ': 'cnpj',
  'Impostos R$': 'impostosRS',
  'Instalação': 'instalacao',
  'Mês de Referência': 'mesReferencia',
  'Data leitura atualizada': 'dataLeituraAtualizada',
  'Data leitura anterior': 'dataLeituraAnterior',
  'Data leitura próxima': 'dataLeituraProxima',
  'Mês de Consumo': 'mesConsumo',
  'Data de vencimento': 'dataVencimento',
  'Data Emissão': 'dataEmissao',
  'Valor Total R$': 'valorTotalRS',
  'Classe': 'classe',
  'SubClasse': 'subClasse',
  'Subgrupo': 'subgrupo',
  'Código de barras': 'codigoBarras',
  'Número da NF': 'numeroNF',
  'Consumo TUSD - Fora Ponta R$': 'consumoTUSDForaPontaRS',
  'Tarifa Consumo TUSD - Fora Ponta': 'tarifaConsumoTUSDForaPonta',
  'Medida Consumo TUSD - Fora Ponta': 'medidaConsumoTUSDForaPonta',
  'Consumo TE - Fora Ponta R$': 'consumoTEForaPontaRS',
  'Tarifa Consumo TE - Fora Ponta': 'tarifaConsumoTEForaPonta',
  'Medida Consumo TE - Fora Ponta': 'medidaConsumoTEForaPonta',
  'Consumo TE - Adicional Bandeira Amarela R$': 'consumoTEAdicionalBandeiraAmarelaRS',
  'Tarifa Consumo TE - Adicional Bandeira Amarela': 'tarifaConsumoTEAdicionalBandeiraAmarela',
  'Medida Consumo TE - Adicional Bandeira Amarela': 'medidaConsumoTEAdicionalBandeiraAmarela',
  'Multa R$': 'multaRS',
  'Ressarcimento R$': 'ressarcimentoRS',
  'Outros R$': 'outrosRS',
  'Alíquota - ICMS': 'aliquotaICMS',
  'Base de cálculo - ICMS R$': 'baseCalculoICMSRS',
  'Custo - ICMS R$': 'custoICMSRS',
  'Alíquota - COFINS': 'aliquotaCOFINS',
  'Base de cálculo - COFINS R$': 'baseCalculoCOFINSRS',
  'Custo - COFINS R$': 'custoCOFINSRS',
  'Alíquota - PIS/PASEP': 'aliquotaPISPASEP',
  'Base de cálculo - PIS/PASEP R$': 'baseCalculoPISPASEPRS',
  'Custo - PIS/PASEP R$': 'custoPISPASEPRS',
  'Serviços - Iluminação Pública R$': 'servicosIluminacaoPublicaRS',
  'Tarifa Serviços - Iluminação Pública': 'tarifaServicosIluminacaoPublica',
  'Medida Serviços - Iluminação Pública': 'medidaServicosIluminacaoPublica',
};

/** Colunas visíveis por padrão na tabela */
export const DEFAULT_VISIBLE_COLUMNS: string[] = [
  'nomeDoSite',
  'nomeConcessionaria',
  'instalacao',
  'mesReferencia',
  'valorTotalRS',
  'medidaConsumoTUSDForaPonta',
  'consumoTUSDForaPontaRS',
  'consumoTEForaPontaRS',
  'custoICMSRS',
  'custoCOFINSRS',
  'custoPISPASEPRS',
  'multaRS',
  'servicosIluminacaoPublicaRS',
];
