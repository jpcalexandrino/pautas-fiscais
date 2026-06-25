export interface UFLayout {
  guideline: string;
  getTableHeaders: (numCols: number) => string[];
}

export const GLOBAL_INSTRUCTIONS = `
INSTRUÇÕES GERAIS DE EXTRAÇÃO E MAPEAMENTO (CRÍTICO):
1. Filtro de Marca Relevante e Descarte Localizado:
   - Você deve extrair APENAS os itens que pertençam à nossa marca (Cidade Imperial, Império, Imperial ou 3.0). Ignore marcas concorrentes (como Ambev, Heineken, Stella, Budweiser, Brahma, Skol, Kaiser, Petrópolis, Coca-Cola, etc.).
   - IMPORTANTE: O descarte de concorrentes deve ser LOCALIZADO. Em tabelas paralelas (como em MG) ou tabelas em matriz (como em PR), um produto nosso e um produto concorrente podem aparecer na mesma linha do Markdown. Nesses casos, extraia as informações do nosso produto normalmente e ignore apenas o concorrente. NUNCA ignore ou descarte a linha inteira do Markdown se ela contiver algum produto da nossa marca.
2. Correspondência Estrita de Volume: O volume (ml ou litros) extraído de cada produto deve obrigatoriamente se alinhar ou cobrir os produtos listados em "produtos_referencia".
   - Se for um item de volume específico, use o volume do produto correspondente (ex: se o PDF tiver 350ml e houver correspondente com 350ml nas referências, use-o). Não invente volumes que não estão cadastrados nas referências (como 355ml se só existir 350ml).
   - Se for uma categoria de faixa (ex: "lata de 300 a 399ml"), preserve a descrição da faixa ("lata de 300 a 399ml") no campo "descricao_estado".
3. Identificação do PMPF / Valor de Pauta com Cabeçalhos Bagunçados (Resiliência de OCR):
   - Os cabeçalhos das tabelas variam muito e podem conter erros de OCR (ex: "PMPF" virar "PNPF" ou "PRECO", "LATA" virar "LA1A"). Mapeie semanticamente os cabeçalhos.
   - NÃO CONFUNDA o valor do PMPF com: código NCM (8 dígitos), alíquota de ICMS (ex: 12%, 18%, 20%, 25%), percentual de MVA (ex: 40%), ou número de item (ex: 1, 2, 3).
   - O PMPF é sempre um valor monetário em reais (ex: 4.50, 6.20). Se o cabeçalho estiver bagunçado ou deslocado, infira a coluna do preço analisando o padrão dos dados da coluna (dados monetários decimais).
4. Retorno Estruturado: Retorne as informações estritamente estruturadas no formato JSON solicitado, sem explicações em prosa.
`;

export const LayoutRegistry: Record<string, UFLayout> = {
  SP: {
    guideline: 'Tabelas estruturadas com colunas de NCM, Descrição do Produto, Volume e Valor de Pauta. O GTIN pode estar na descrição ou em coluna separada.',
    getTableHeaders: (numCols: number) => {
      if (numCols === 4) return ['NCM', 'DESCRICAO_PRODUTO', 'VOLUME', 'VALOR_PAUTA'];
      if (numCols === 5) return ['NCM', 'DESCRICAO_PRODUTO', 'VOLUME', 'VALOR_PAUTA', 'GTIN'];
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  },
  RJ: {
    guideline: 'O nome do fabricante (ex: Cidade Imperial / Império / Imperial) geralmente está em cabeçalhos acima das listas de produtos. Propague esse nome do fabricante/marca para a descrição de cada item extraído.',
    getTableHeaders: (numCols: number) => {
      if (numCols === 4) return ['PRODUTO', 'EMBALAGEM', 'VOLUME', 'VALOR_PAUTA'];
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  },
  MG: {
    guideline: 'As tabelas do estado de Minas Gerais trazem as colunas ITEM, EMBALAGEM_VOLUME, MARCA_PRODUTO, COD_FABRICANTE e VALOR_PMPF. IMPORTANTE: Essas tabelas costumam ser paralelas e vir lado a lado na mesma página. No Markdown, isso aparecerá como uma única linha de tabela com cerca de 12 colunas, contendo duas sequências de dados (ex: ITEM | EMBALAGEM_VOLUME | MARCA_PRODUTO | COD_FABRICANTE | VALOR_PMPF | | | ITEM | EMBALAGEM_VOLUME | MARCA_PRODUTO | COD_FABRICANTE | VALOR_PMPF). Você DEVE tratar cada grupo de colunas (as colunas de 1 a 5 e as de 8 a 12) de forma totalmente independente para extrair os produtos correspondentes. Se uma das colunas (ou lados) pertencer a um concorrente e a outra metade for um produto da nossa marca, descarte apenas a metade do concorrente e extraia a nossa marca normalmente. NUNCA misture ou confunda os dados de um lado com a coluna de preço (VALOR_PMPF) da coluna paralela do outro lado.',
    getTableHeaders: (numCols: number) => {
      if (numCols === 12) {
        return [
          'ITEM', 'EMBALAGEM_VOLUME', 'MARCA_PRODUTO', 'COD_FABRICANTE', 'VALOR_PMPF',
          '', '',
          'ITEM', 'EMBALAGEM_VOLUME', 'MARCA_PRODUTO', 'COD_FABRICANTE', 'VALOR_PMPF'
        ];
      }
      if (numCols === 5) {
        return ['ITEM', 'EMBALAGEM_VOLUME', 'MARCA_PRODUTO', 'COD_FABRICANTE', 'VALOR_PMPF'];
      }
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  },
  PR: {
    guideline: 'O Paraná (PR) utiliza tabelas em matriz onde cada linha representa uma marca/produto (especificada na coluna MARCA_PRODUTO) e as colunas subsequentes representam tipos de embalagens/volumes (ex: VIDRO_PET_DESCARTAVEL_ATE_330ML, LATA_ALUMINIO, BARRIL_ATE_5L, etc.) com o preço de pauta correspondente. Para cada linha de produto que pertença à nossa marca, você DEVE gerar um objeto JSON separado para cada coluna subsequente que contiver um preço válido (desconsidere colunas vazias ou com traço "-"). Para cada item extraído, monte a "descricao_estado" juntando o nome da marca/produto da linha com a descrição da embalagem/faixa de volume do cabeçalho da coluna (ex: "IMPERIO PILSEN LATA_ALUMINIO") e use o valor daquela coluna como valor_pauta.',
    getTableHeaders: (numCols: number) => {
      if (numCols === 17) {
        return [
          'CNPJ_FABRICANTE',
          'MARCA_PRODUTO',
          'GARRAFA_VIDRO_PET_DESCARTAVEL_ATE_330ML',
          'GARRAFA_VIDRO_PET_DESCARTAVEL_331_450ML',
          'GARRAFA_VIDRO_PET_DESCARTAVEL_451_650ML',
          'GARRAFA_VIDRO_PET_DESCARTAVEL_651_1000ML',
          'GARRAFA_VIDRO_PET_DESCARTAVEL_ACIMA_1000ML',
          'GARRAFA_VIDRO_RETORNAVEL_ATE_360ML',
          'GARRAFA_VIDRO_RETORNAVEL_361_660ML',
          'GARRAFA_VIDRO_RETORNAVEL_ACIMA_660ML',
          'LATA_ALUMINIO_ATE_300ML',
          'LATA_ALUMINIO_301_349ML',
          'LATA_ALUMINIO_350_450ML',
          'LATA_ALUMINIO_ACIMA_450ML',
          'BARRIL_KEG_ATE_5L',
          'BARRIL_LITRO',
          'KIT_GARRAFA_COPOS'
        ];
      }
      if (numCols === 10) {
        return [
          'CNPJ_FABRICANTE', 'MARCA_PRODUTO',
          'VIDRO_PET_DESCARTAVEL_ATE_330ML',
          'VIDRO_PET_DESCARTAVEL_331_450ML',
          'VIDRO_PET_DESCARTAVEL_451_650ML',
          'VIDRO_PET_DESCARTAVEL_ACIMA_1000ML',
          'RETORNAVEL',
          'LATA_ALUMINIO',
          'BARRIL_ATE_5L',
          'KIT_LITRO'
        ];
      }
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  },
  PB: {
    guideline: 'Tabelas estruturadas com colunas de Fabricante/Distribuidor, Tipo, Marca, Tipo de Embalagem, Capacidade (ml), EAN/GTIN e Preço Sugerido. Associe a coluna de Preço Sugerido diretamente ao campo valor_pauta.',
    getTableHeaders: (numCols: number) => {
      if (numCols === 7) return ['FABRICANTE_DISTRIBUIDOR', 'TIPO', 'MARCA', 'TIPO_EMBALAGEM', 'CAPACIDADE_ML', 'EAN_GTIN', 'PRECO_SUGERIDO'];
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  },
  MS: {
    guideline: 'Tabelas estruturadas com colunas de Código, Descrição, Tipo, Valor (R$) e Ação. O campo Valor (R$) representa o valor_pauta.',
    getTableHeaders: (numCols: number) => {
      if (numCols === 5) return ['CODIGO', 'DESCRICAO', 'TIPO', 'VALOR_RS', 'ACAO'];
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  },
  SE: {
    guideline: 'A tabela possui apenas 2 colunas principais: PRODUTO/MARCA/TIPO e VALOR (R$). As embalagens e faixas de volumes correspondentes são descritas em linhas divisórias horizontais de seção (ex: "Cerveja em garrafa descartável de 200ml a 240ml" ou "Cerveja em lata de 300ml a 399ml"). Você DEVE propagar a embalagem e a faixa de volume descritas nessas linhas divisórias para todos os itens listados logo abaixo dela, até que apareça uma nova linha divisória de seção.',
    getTableHeaders: (numCols: number) => {
      if (numCols === 2) return ['PRODUTO_MARCA_TIPO', 'VALOR_RS'];
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  }
};

export function getLayoutForUF(uf: string): UFLayout {
  const ufUpper = uf.toUpperCase();
  return LayoutRegistry[ufUpper] || {
    guideline: '',
    getTableHeaders: (numCols: number) => Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`)
  };
}
