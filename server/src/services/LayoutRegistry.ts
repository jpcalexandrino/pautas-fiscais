export interface UFLayout {
  guideline: string;
  getTableHeaders: (numCols: number) => string[];
}

export const GLOBAL_INSTRUCTIONS = `
INSTRUÇÕES GERAIS DE EXTRAÇÃO E MAPEAMENTO (CRÍTICO):
1. Filtro de Marca Relevante: Você deve extrair APENAS os itens da marca Cidade Imperial, Império, Imperial ou 3.0. Ignore marcas concorrentes (como Ambev, Heineken, Petrópolis, Coca-Cola, etc.).
2. Correspondência Estrita de Volume: O volume (ml ou litros) extraído de cada produto deve obrigatoriamente se alinhar ou cobrir os produtos listados em "produtos_referencia".
   - Se for um item de volume específico, use o volume do produto correspondente (ex: se o PDF tiver 350ml e houver correspondente com 350ml nas referências, use-o). Não invente volumes que não estão cadastrados nas referências (como 355ml se só existir 350ml).
   - Se for uma categoria de faixa (ex: "lata de 300 a 399ml"), preserve a descrição da faixa ("lata de 300 a 399ml") no campo "descricao_estado".
3. Identificação do PMPF / Valor de Pauta: Os cabeçalhos das tabelas variam muito. Identifique a coluna correta do Preço Médio (PMPF, Valor de Pauta, Preço Sugerido, Preço de Referência).
   - NÃO CONFUNDA o valor do PMPF com: código NCM, alíquota de ICMS (ex: 18%), percentual de MVA (ex: 40%), ou código de fabricante. O PMPF é tipicamente um valor monetário em reais (ex: 4,50, 6,20).
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
    guideline: 'As tabelas do estado de Minas Gerais trazem as colunas ITEM, EMBALAGEM_VOLUME, MARCA_PRODUTO, COD_FABRICANTE e VALOR_PMPF. IMPORTANTE: Essas tabelas costumam ser paralelas e vir lado a lado na mesma página. No Markdown, isso aparecerá como uma única linha de tabela com cerca de 12 colunas, contendo duas sequências de dados (ex: ITEM | EMBALAGEM_VOLUME | MARCA_PRODUTO | COD_FABRICANTE | VALOR_PMPF | | | ITEM | EMBALAGEM_VOLUME | MARCA_PRODUTO | COD_FABRICANTE | VALOR_PMPF). Você DEVE tratar cada grupo de colunas de forma totalmente independente para extrair os produtos correspondentes. Nunca misture o nome/marca de um produto com o valor de pauta (VALOR_PMPF) da coluna lateral.',
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
    guideline: 'O cabeçalho das tabelas traz colunas CNPJ BASE E NOME DO FABRICANTE/IMPORTADOR, MARCAS e uma matriz de categorias de embalagens (garrafa de vidro/PET descartável, garrafa retornável, lata de alumínio, barril, kit, litro), cada uma subdividida por faixas de volume. Os valores de pauta aparecem distribuídos nessas subcolunas conforme o tipo de embalagem e volume.',
    getTableHeaders: (numCols: number) => {
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
