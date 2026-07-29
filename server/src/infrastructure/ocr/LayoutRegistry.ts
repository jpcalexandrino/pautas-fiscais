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
      if (numCols === 6) return ['CHAVE', 'NCM', 'DESCRICAO_PRODUTO', 'EMBALAGEM', 'VOLUME', 'VALOR_PAUTA'];
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
    guideline: `A pauta de Sergipe possui uma hierarquia de TRÊS NÍVEIS que deve ser respeitada rigorosamente:

NÍVEL 1 — Tipo de produto (ex: "Cerveja", "Refrigerante", "Suco"):
  - Quando o tipo muda para algo que não seja cerveja ou chopp, desconsidere todos os itens subsequentes até aparecer uma seção de cerveja.

NÍVEL 2 — Subcabeçalho de embalagem + faixa de volume (ex: "Cerveja em garrafa descartável de 276 ml a 399 ml", "Cerveja em lata de 300ml a 399ml"):
  - Propague essa informação para TODOS os itens listados abaixo desta linha, até que apareça um novo subcabeçalho de seção.
  - O subcabeçalho é sempre uma descrição longa sem preço associado.

NÍVEL 3 — Linhas de produto: PRODUTO/MARCA/TIPO | VALOR (R$).
  - Monte a "descricao_estado" concatenando o nome do produto com o subcabeçalho ativo do Nível 2.

ATENÇÃO — COLUNAS PARALELAS: A tabela pode ter duas colunas lado a lado no PDF (coluna esquerda e coluna direita). Cada coluna possui sua própria cadeia de subcabeçalhos INDEPENDENTE. NUNCA propague o subcabeçalho da coluna esquerda para os produtos da coluna direita ou vice-versa. Trate cada coluna de forma completamente isolada.`,
    getTableHeaders: (numCols: number) => {
      if (numCols === 2) return ['PRODUTO_MARCA_TIPO', 'VALOR_RS'];
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  },
  AL: {
    guideline: 'Tabelas do estado de Alagoas (AL) possuem colunas: CÓDIGO, PRODUTO / MARCA / TIPO, VOLUME, GTIN, EMBALAGEM e PMPF.',
    getTableHeaders: (numCols: number) => {
      const standard = ['CODIGO', 'PRODUTO_MARCA_TIPO', 'VOLUME', 'GTIN', 'EMBALAGEM', 'PMPF'];
      if (numCols <= 6) return standard.slice(0, numCols);
      return [...standard, ...Array.from({ length: numCols - 6 }).map((_, i) => `COLUNA_${i + 7}`)];
    }
  },
  AP: {
    guideline: 'O Amapá (AP) utiliza tabelas em matriz onde cada linha representa o fabricante e marca/produto e as colunas representam tipos de embalagens/volumes com o preço de pauta correspondente: GARRAFA_RETORNAVEL_600ML, GARRAFA_RETORNAVEL_1000ML, GARRAFA_DESC_RETORNAVEL_ATE_390ML, GARRAFA_DESCARTAVEL_391_660ML, GARRAFA_DESCARTAVEL_1000ML, LATA_ATE_270ML, LATA_271_360ML, LATA_361_660ML.',
    getTableHeaders: (numCols: number) => {
      if (numCols === 10) {
        return [
          'FABRICANTE',
          'MARCA_PRODUTO',
          'GARRAFA_RETORNAVEL_600ML',
          'GARRAFA_RETORNAVEL_1000ML',
          'GARRAFA_DESC_RETORNAVEL_ATE_390ML',
          'GARRAFA_DESCARTAVEL_391_660ML',
          'GARRAFA_DESCARTAVEL_1000ML',
          'LATA_ATE_270ML',
          'LATA_271_360ML',
          'LATA_361_660ML'
        ];
      }
      if (numCols === 9) {
        return [
          'MARCA_PRODUTO',
          'GARRAFA_RETORNAVEL_600ML',
          'GARRAFA_RETORNAVEL_1000ML',
          'GARRAFA_DESC_RETORNAVEL_ATE_390ML',
          'GARRAFA_DESCARTAVEL_391_660ML',
          'GARRAFA_DESCARTAVEL_1000ML',
          'LATA_ATE_270ML',
          'LATA_271_360ML',
          'LATA_361_660ML'
        ];
      }
      return Array.from({ length: numCols }).map((_, i) => `COLUNA_${i + 1}`);
    }
  },
  DF: {
    guideline: 'Tabelas do Distrito Federal (DF) possuem 6 colunas estruturadas: Marca, Nome, Embalagem, Tipo, Volume e Valor (R$).',
    getTableHeaders: (numCols: number) => {
      const standard = ['MARCA', 'NOME', 'EMBALAGEM', 'TIPO', 'VOLUME', 'VALOR'];
      if (numCols <= 6) return standard.slice(0, numCols);
      return [...standard, ...Array.from({ length: numCols - 6 }).map((_, i) => `COLUNA_${i + 7}`)];
    }
  },
  MA: {
    guideline: 'Tabelas do estado do Maranhão (MA) possuem subcabeçalhos de Grupo/Subgrupo/Embalagem (ex: "Subgrupo 15 = Cerveja - Lata | Emb 15 - 710 ml"). As colunas são: Códigos, und, Discriminação e Valor R$. Propague a descrição da embalagem/faixa de volume do subgrupo ativo para a discriminação do produto.',
    getTableHeaders: (numCols: number) => {
      const standard = ['CODIGO', 'UNIDADE', 'DISCRIMINACAO', 'VALOR_RS'];
      if (numCols <= 4) return standard.slice(0, numCols);
      return [...standard, ...Array.from({ length: numCols - 4 }).map((_, i) => `COLUNA_${i + 5}`)];
    }
  },
  MT: {
    guideline: 'Tabelas do estado de Mato Grosso (MT) possuem 5 colunas estruturadas: ORDEM, CÓDIGO GTIN/EAN, DESCRIÇÃO, UNIDADE DE MEDIDA e VALOR (R$).',
    getTableHeaders: (numCols: number) => {
      const standard = ['ORDEM', 'CODIGO_GTIN_EAN', 'DESCRICAO', 'UNIDADE_DE_MEDIDA', 'VALOR_RS'];
      if (numCols <= 5) return standard.slice(0, numCols);
      return [...standard, ...Array.from({ length: numCols - 5 }).map((_, i) => `COLUNA_${i + 6}`)];
    }
  },
  PA: {
    guideline: 'Tabelas do estado do Pará (PA) possuem 9 colunas estruturadas: FABRICANTE, MARCA / DESCRIÇÃO, EMBALAGEM, MATERIAL, RETORNÁVEL / DESCARTÁVEL, VOLUME (ML), GTIN / EAN, PREÇO (R$) e EFEITOS A PARTIR DE.',
    getTableHeaders: (numCols: number) => {
      const standard = [
        'FABRICANTE',
        'MARCA_DESCRICAO',
        'EMBALAGEM',
        'MATERIAL',
        'RETORNAVEL_DESCARTAVEL',
        'VOLUME_ML',
        'GTIN_EAN',
        'PRECO_RS',
        'EFEITOS_A_PARTIR_DE'
      ];
      if (numCols <= 9) return standard.slice(0, numCols);
      return [...standard, ...Array.from({ length: numCols - 9 }).map((_, i) => `COLUNA_${i + 10}`)];
    }
  },
  PE: {
    guideline: 'Tabelas do estado de Pernambuco (PE) possuem 2 colunas: MERCADORIA/MARCA/TIPO e BASE DE CÁLCULO ICMS (R$). Possuem subcabeçalhos de embalagem/volume (ex: "Cerveja em garrafa retornável até 360 ml"). Propague a descrição do subcabeçalho ativo para o nome do produto.',
    getTableHeaders: (numCols: number) => {
      const standard = ['MERCADORIA_MARCA_TIPO', 'VALOR_RS'];
      if (numCols <= 2) return standard.slice(0, numCols);
      return [...standard, ...Array.from({ length: numCols - 2 }).map((_, i) => `COLUNA_${i + 3}`)];
    }
  },
  PI: {
    guideline: 'Tabelas do estado do Piauí (PI) possuem 4 colunas estruturadas: ITEM, PRODUTO, UNIDADE e PMPF (R$).',
    getTableHeaders: (numCols: number) => {
      const standard = ['ITEM', 'PRODUTO', 'UNIDADE', 'PMPF_RS'];
      if (numCols <= 4) return standard.slice(0, numCols);
      return [...standard, ...Array.from({ length: numCols - 4 }).map((_, i) => `COLUNA_${i + 5}`)];
    }
  },
  RN: {
    guideline: 'Tabelas do estado do Rio Grande do Norte (RN) possuem 7 colunas estruturadas: ID, FABRICANTE, EMBALAGEM, TIPO EMB., VOLUME (ML), MARCA e PMPF.',
    getTableHeaders: (numCols: number) => {
      if (numCols >= 7) {
        const standard = ['ID', 'FABRICANTE', 'EMBALAGEM', 'TIPO_EMB', 'VOLUME_ML', 'MARCA', 'PMPF'];
        if (numCols === 7) return standard;
        return [...standard, ...Array.from({ length: numCols - 7 }).map((_, i) => `COLUNA_${i + 8}`)];
      }
      const standard6 = ['ID', 'FABRICANTE', 'EMBALAGEM', 'TIPO_E_VOLUME', 'MARCA', 'PMPF'];
      if (numCols <= 6) return standard6.slice(0, numCols);
      return [...standard6, ...Array.from({ length: numCols - 6 }).map((_, i) => `COLUNA_${i + 7}`)];
    }
  },
  RO: {
    guideline: 'Tabelas do estado de Rondônia (RO) possuem 9 colunas estruturadas: FABRICANTE, DESCRIÇÃO, EMBALAGEM, CAPACIDADE (ml), EAN / GTIN (unitário), NCM, CEST, PMPF (R$) e VIGÊNCIA.',
    getTableHeaders: (numCols: number) => {
      const standard = [
        'FABRICANTE',
        'DESCRICAO',
        'EMBALAGEM',
        'CAPACIDADE_ML',
        'EAN_GTIN',
        'NCM',
        'CEST',
        'PMPF_RS',
        'VIGENCIA'
      ];
      if (numCols <= 9) return standard.slice(0, numCols);
      return [...standard, ...Array.from({ length: numCols - 9 }).map((_, i) => `COLUNA_${i + 10}`)];
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
