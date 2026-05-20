import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  PageBreak, 
  AlignmentType 
} from 'docx';
import fs from 'fs';
import path from 'path';

// Cores do Tema
const COLOR_PRIMARY = "1B365D";   // Deep Navy Blue
const COLOR_SECONDARY = "5C768D"; // Slate Grey
const COLOR_TEXT = "2F3E46";      // Dark Slate Grey
const COLOR_BG_HEADER = "F4F6F8"; // Light Grey para cabeçalho de tabelas
const COLOR_WHITE = "FFFFFF";

// Helpers de formatação
function createTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 2400, after: 360 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 56, // 28pt
        color: COLOR_PRIMARY,
        font: "Arial"
      })
    ]
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 2400 },
    children: [
      new TextRun({
        text: text,
        size: 32, // 16pt
        color: COLOR_SECONDARY,
        font: "Arial",
        italic: true
      })
    ]
  });
}

function createMetaInfo(label, value) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 100 },
    children: [
      new TextRun({
        text: label + ": ",
        bold: true,
        size: 20,
        color: COLOR_TEXT,
        font: "Arial"
      }),
      new TextRun({
        text: value,
        size: 20,
        color: COLOR_TEXT,
        font: "Arial"
      })
    ]
  });
}

function createH1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 36, // 18pt
        color: COLOR_PRIMARY,
        font: "Arial"
      })
    ]
  });
}

function createH2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 28, // 14pt
        color: COLOR_SECONDARY,
        font: "Arial"
      })
    ]
  });
}

function createH3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 22, // 11pt
        color: COLOR_TEXT,
        font: "Arial"
      })
    ]
  });
}

function createBodyParagraph(text, bold = false, italic = false) {
  return new Paragraph({
    spacing: { before: 120, after: 120, line: 276 }, // Espaçamento 1.15
    children: [
      new TextRun({
        text: text,
        size: 22, // 11pt
        color: COLOR_TEXT,
        font: "Arial",
        bold: bold,
        italic: italic
      })
    ]
  });
}

function createBulletPoint(text, boldPrefix = "") {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({
      text: boldPrefix,
      bold: true,
      size: 22,
      color: COLOR_TEXT,
      font: "Arial"
    }));
  }
  children.push(new TextRun({
    text: text,
    size: 22,
    color: COLOR_TEXT,
    font: "Arial"
  }));

  return new Paragraph({
    bullet: {
      level: 0
    },
    spacing: { before: 60, after: 60 },
    children: children
  });
}

function createTableCell(text, isHeader = false, widthPct = 25, bold = false, align = AlignmentType.LEFT) {
  return new TableCell({
    width: {
      size: widthPct,
      type: WidthType.PERCENTAGE
    },
    shading: {
      fill: isHeader ? COLOR_PRIMARY : COLOR_WHITE,
    },
    margins: {
      top: 120,
      bottom: 120,
      left: 150,
      right: 150,
    },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text: text,
            bold: isHeader || bold,
            color: isHeader ? COLOR_WHITE : COLOR_TEXT,
            size: isHeader ? 20 : 18, // 10pt para cabeçalho, 9pt para conteúdo
            font: "Arial"
          })
        ]
      })
    ]
  });
}

function buildDocument() {
  const children = [];

  // ==================== CAPA ====================
  children.push(createTitle("AUDIT ENERGY"));
  children.push(createSubtitle("Especificação e Documentação Técnica do Sistema"));
  
  children.push(createMetaInfo("Projeto", "Plataforma de Auditoria e Eficiência Energética"));
  children.push(createMetaInfo("Autor", "Equipe de Engenharia de Software"));
  children.push(createMetaInfo("Versão", "1.1.0"));
  children.push(createMetaInfo("Data de Geração", new Date().toLocaleDateString('pt-BR')));
  children.push(createMetaInfo("Status", "Documento Homologado"));
  
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== SEÇÃO 1: VISÃO GERAL ====================
  children.push(createH1("1. Visão Geral do Sistema"));
  children.push(createBodyParagraph(
    "O Audit Energy é uma solução corporativa robusta desenvolvida para a centralização, controle e gestão estratégica de faturas de energia elétrica. O objetivo central da plataforma é automatizar a consolidação de dados de faturamento de Unidades Consumidoras (UCs), fornecendo a gestores e consultores um painel analítico para acompanhar o histórico de consumo, auditar custos tributários e tarifas aplicadas pelas distribuidoras de energia, e gerar relatórios gerenciais personalizados em formato PDF de alto padrão para envio e acompanhamento direto com seus respectivos clientes."
  ));
  children.push(createBodyParagraph(
    "Como recurso complementar, caso exista o levantamento técnico de inventário de carga (potência e operação de equipamentos em campo), o sistema integra e confronta essa simulação teórica com o faturamento real para estimar distorções e sugerir oportunidades de eficientização."
  ));
  
  children.push(createBodyParagraph("Os principais recursos e dores de negócio solucionados pela plataforma incluem:"));
  children.push(createBulletPoint(" Consolidação automática e manual de faturas nos formatos de planilha eletrônica (XLSX, XLS e CSV) ou sincronização programada direta com APIs do mercado.", "Controle de Faturas & Importação:"));
  children.push(createBulletPoint(" Painel de consolidação para monitorar evolução de consumo (kWh), despesas acumuladas, taxas tributárias e tarifas contratuais de forma integrada por cliente ou de forma global.", "Gestão Analítica de Despesas:"));
  children.push(createBulletPoint(" Geração automatizada de relatórios em PDF com gráficos consolidados de consumo e faturamento para os clientes finais da consultoria.", "Geração e Compartilhamento de PDFs:"));
  children.push(createBulletPoint(" Integração opcional do consumo real faturado contra a estimativa de consumo de equipamentos elétricos (motores, iluminação, condicionamento ambiental) cadastrados na Unidade Consumidora, se mapeados.", "Simulação de Carga e Distorções:"));
  children.push(createBulletPoint(" Emprego de inteligência artificial de ponta (Groq LLM) para analisar dados do faturamento e sugerir melhorias operacionais, ações preventivas e otimizações tributárias diretamente nos relatórios.", "Insights Inteligentes via IA:"));
  children.push(createBulletPoint(" Disparo ágil e direto de relatórios gerados em PDF para os endereços de e-mail dos gestores dos respectivos clientes via SMTP integrado.", "Disparo Automático por E-mail:"));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== SEÇÃO 2: ARQUITETURA E TECNOLOGIAS ====================
  children.push(createH1("2. Arquitetura e Tecnologias Utilizadas"));
  children.push(createBodyParagraph(
    "A aplicação é desenvolvida sob o modelo de Single Page Application (SPA) no frontend e uma API RESTful no backend. A arquitetura privilegia o desacoplamento de responsabilidades, facilidade de manutenção e segurança por meio de autenticação baseada em JWT (JSON Web Tokens)."
  ));

  children.push(createH2("2.1 Tecnologias do Backend"));
  children.push(createBulletPoint(" Runtime moderno e performático para o desenvolvimento backend.", "Node.js (v24.15.0):"));
  children.push(createBulletPoint(" Framework robusto e flexível para construção das rotas e controladores HTTP.", "Express.js (v5.2.1):"));
  children.push(createBulletPoint(" Linguagem tipada que eleva a robustez e previne erros comuns durante a codificação.", "TypeScript (v5.8.2):"));
  children.push(createBulletPoint(" Banco de dados relacional que suporta alta carga de transações e consultas complexas.", "PostgreSQL (pg v8.20.0):"));
  children.push(createBulletPoint(" Ferramenta de execução e transpilação rápida de arquivos TypeScript para desenvolvimento.", "tsx (v4.19.3):"));
  children.push(createBulletPoint(" Criptografia de senhas usando hashing com salt (10 rounds).", "Bcryptjs (v3.0.3):"));
  children.push(createBulletPoint(" Padrão de autenticação segura e stateless com tempo de expiração de 7 dias.", "JWT (jsonwebtoken v9.0.3):"));
  children.push(createBulletPoint(" Biblioteca para disparo de relatórios técnicos em anexo por e-mail via conexão SMTP.", "Nodemailer (v8.0.7):"));
  children.push(createBulletPoint(" Integração com a API de LLM da Groq (Llama-3.3-70b-versatile) para a geração automatizada de insights.", "Integração Groq:"));

  children.push(createH2("2.2 Tecnologias do Frontend"));
  children.push(createBulletPoint(" Biblioteca declarativa para renderização de interfaces reativas baseadas em componentes.", "React (v19.2.5):"));
  children.push(createBulletPoint(" Ferramenta de build ultra-rápida baseada em ESBuild e Rollup.", "Vite (v8.0.10):"));
  children.push(createBulletPoint(" Roteador com segurança de tipos (Type-safe router) integrado com o plugin Vite correspondente.", "TanStack React Router (v1.169.2):"));
  children.push(createBulletPoint(" Gerenciamento de estado assíncrono e cacheamento reativo de requisições.", "TanStack React Query (v5.100.9):"));
  children.push(createBulletPoint(" Framework de estilos em CSS utilitário para layouts limpos e responsivos.", "TailwindCSS (v4.2.4):"));
  children.push(createBulletPoint(" Componentes visuais acessíveis e consistentes baseados no Radix UI e estilizados via Tailwind.", "Shadcn UI (v4.7.0):"));
  children.push(createBulletPoint(" Família tipográfica moderna carregada de forma otimizada no layout da aplicação.", "Inter Variable (@fontsource-variable/inter):"));
  children.push(createBulletPoint(" Geração de PDFs complexos diretamente no navegador a partir de componentes React JSX.", "@react-pdf/renderer (v4.5.1):"));
  children.push(createBulletPoint(" Bibliotecas para manipulação e parser de dados brutos de planilhas locais.", "XLSX & PapaParse:"));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== SEÇÃO 3: BANCO DE DADOS ====================
  children.push(createH1("3. Modelagem do Banco de Dados"));
  children.push(createBodyParagraph(
    "O banco de dados PostgreSQL armazena as entidades de usuários, clientes (unidades consumidoras), equipamentos físicos (inventário de carga) e faturas elétricas. A seguir são detalhados os esquemas de cada tabela."
  ));

  // Tabela: dim_usuarios
  children.push(createH2("3.1 Tabela: dim_usuarios"));
  children.push(createBodyParagraph("Armazena as credenciais de acesso dos usuários à plataforma Audit Energy."));
  
  const tableUsers = new Table({
    rows: [
      new TableRow({
        children: [
          createTableCell("Coluna", true, 20),
          createTableCell("Tipo de Dados", true, 25),
          createTableCell("Nulidade", true, 15),
          createTableCell("Descrição / Restrições", true, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("sk_usuario", false, 20, true),
          createTableCell("SERIAL", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Chave primária autoincrementada (Surrogate Key)", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("nome", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Nome completo do usuário", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("email", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("E-mail único utilizado para autenticação", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("senha_hash", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Hash da senha (bcrypt)", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("perfil", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("DEFAULT 'user'", false, 15),
          createTableCell("Papel de autorização ('admin' ou 'user')", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("ativo", false, 20, true),
          createTableCell("BOOLEAN", false, 25),
          createTableCell("DEFAULT true", false, 15),
          createTableCell("Indica se o cadastro está ativo no sistema", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("criado_em", false, 20, true),
          createTableCell("TIMESTAMP", false, 25),
          createTableCell("DEFAULT NOW()", false, 15),
          createTableCell("Data e hora de criação do usuário", false, 40)
        ]
      })
    ]
  });
  children.push(tableUsers);
  children.push(new Paragraph({ spacing: { before: 100, after: 100 } }));

  // Tabela: dim_clientes
  children.push(createH2("3.2 Tabela: dim_clientes"));
  children.push(createBodyParagraph("Armazena as Unidades Consumidoras de energia. Cada registro representa um local de auditoria."));

  const clientsCols = [
    { col: "sk_cliente", type: "SERIAL", nullity: "NOT NULL", desc: "Chave primária autoincrementada (Surrogate Key)", bold: true },
    { col: "nk_uc", type: "TEXT", nullity: "NULL", desc: "Número da Unidade Consumidora (Natural Key / Identificador Único)" },
    { col: "nome", type: "TEXT", nullity: "NOT NULL", desc: "Razão Social ou Nome do Site do Cliente" },
    { col: "distribuidora", type: "TEXT", nullity: "NULL", desc: "Distribuidora de energia (ex: Light, Enel)" },
    { col: "subgrupo", type: "TEXT", nullity: "NULL", desc: "Subgrupo de tensão tarifária (ex: A4, B3)" },
    { col: "nk_cnpj", type: "TEXT", nullity: "NULL", desc: "CNPJ da Unidade Consumidora (Natural Key)" },
    { col: "email_contato", type: "TEXT", nullity: "NULL", desc: "E-mail de contato para envio do relatório PDF" },
    { col: "cep", type: "TEXT", nullity: "NULL", desc: "CEP do local de consumo" },
    { col: "uf", type: "TEXT", nullity: "NULL", desc: "Estado (UF) do local de consumo" },
    { col: "cidade", type: "TEXT", nullity: "NULL", desc: "Cidade do local de consumo" },
    { col: "endereco", type: "TEXT", nullity: "NULL", desc: "Logradouro/Rua do endereço do site" },
    { col: "numero", type: "TEXT", nullity: "NULL", desc: "Número do local no endereço" },
    { col: "complemento", type: "TEXT", nullity: "NULL", desc: "Complemento do endereço do site" },
    { col: "criado_em", type: "TIMESTAMP", nullity: "DEFAULT NOW()", desc: "Data e hora de criação do registro da UC" }
  ];

  const tableClients = new Table({
    rows: [
      new TableRow({
        children: [
          createTableCell("Coluna", true, 20),
          createTableCell("Tipo de Dados", true, 25),
          createTableCell("Nulidade", true, 15),
          createTableCell("Descrição", true, 40)
        ]
      }),
      ...clientsCols.map(c => new TableRow({
        children: [
          createTableCell(c.col, false, 20, c.bold || false),
          createTableCell(c.type, false, 25),
          createTableCell(c.nullity, false, 15),
          createTableCell(c.desc, false, 40)
        ]
      }))
    ]
  });
  children.push(tableClients);
  children.push(new Paragraph({ spacing: { before: 100, after: 100 } }));

  // Tabela: dim_equipamentos
  children.push(createH2("3.3 Tabela: dim_equipamentos"));
  children.push(createBodyParagraph("Contém o inventário de dispositivos elétricos de campo associados a um determinado cliente/UC."));

  const equipmentCols = [
    { col: "sk_equipamento", type: "SERIAL", nullity: "NOT NULL", desc: "Chave primária autoincrementada (Surrogate Key)", bold: true },
    { col: "fk_cliente", type: "INTEGER", nullity: "NOT NULL", desc: "Chave estrangeira referenciando dim_clientes(sk_cliente) ON DELETE CASCADE" },
    { col: "nome", type: "TEXT", nullity: "NOT NULL", desc: "Nome do equipamento (ex: Motor 15 CV)" },
    { col: "potencia_w", type: "NUMERIC", nullity: "DEFAULT 0", desc: "Potência nominal do dispositivo em Watts" },
    { col: "horas_uso_dia", type: "NUMERIC", nullity: "DEFAULT 0", desc: "Estimativa de uso diário em horas" },
    { col: "wh_dia", type: "NUMERIC", nullity: "DEFAULT 0", desc: "Consumo estimado diário em Watt-hora" },
    { col: "quantidade", type: "INTEGER", nullity: "DEFAULT 1", desc: "Quantidade de unidades idênticas do equipamento" },
    { col: "tarifa", type: "NUMERIC", nullity: "DEFAULT 0", desc: "Custo tarifário aplicado por kWh (R$)" },
    { col: "criado_em", type: "TIMESTAMP", nullity: "DEFAULT NOW()", desc: "Data e hora de criação do cadastro do equipamento" }
  ];

  const tableEquipment = new Table({
    rows: [
      new TableRow({
        children: [
          createTableCell("Coluna", true, 20),
          createTableCell("Tipo de Dados", true, 25),
          createTableCell("Nulidade", true, 15),
          createTableCell("Descrição / Relacionamento", true, 40)
        ]
      }),
      ...equipmentCols.map(c => new TableRow({
        children: [
          createTableCell(c.col, false, 20, c.bold || false),
          createTableCell(c.type, false, 25),
          createTableCell(c.nullity, false, 15),
          createTableCell(c.desc, false, 40)
        ]
      }))
    ]
  });
  children.push(tableEquipment);
  children.push(new Paragraph({ spacing: { before: 100, after: 100 } }));

  // Tabela: fato_faturas
  children.push(createH2("3.4 Tabela: fato_faturas"));
  children.push(createBodyParagraph(
    "Esta tabela possui grande dimensionalidade de colunas para suportar todos os campos que podem ser extraídos de planilhas complexas de auditoria energética ou da API PowerHub da Way2."
  ));

  const faturasCols = [
    { col: "sk_fatura", type: "SERIAL", nullity: "NOT NULL", desc: "Chave primária autoincrementada (Surrogate Key)", bold: true },
    { col: "nome_do_site", type: "TEXT", nullity: "NULL", desc: "Nome identificador da planta/instalação" },
    { col: "nome_do_cliente", type: "TEXT", nullity: "NULL", desc: "Razão social do cliente associado" },
    { col: "fonte", type: "TEXT", nullity: "NULL", desc: "Origem da fatura ('Excel', 'CSV', 'PowerHUB')" },
    { col: "modalidade_tarifaria", type: "TEXT", nullity: "NULL", desc: "Modalidade tarifária (ex: Verde, Azul, Convencional)" },
    { col: "data_insercao", type: "DATE", nullity: "NULL", desc: "Data em que a fatura foi importada" },
    { col: "nome_concessionaria", type: "TEXT", nullity: "NULL", desc: "Distribuidora de energia concessionária" },
    { col: "cnpj_concessionaria", type: "TEXT", nullity: "NULL", desc: "CNPJ da concessionária de energia" },
    { col: "endereco", type: "TEXT", nullity: "NULL", desc: "Endereço de cobrança da fatura" },
    { col: "cep", type: "TEXT", nullity: "NULL", desc: "CEP da instalação da fatura" },
    { col: "cidade", type: "TEXT", nullity: "NULL", desc: "Cidade da instalação da fatura" },
    { col: "uf", type: "TEXT", nullity: "NULL", desc: "Estado da instalação da fatura" },
    { col: "cnpj", type: "TEXT", nullity: "NULL", desc: "CNPJ do cliente/consumidor na fatura" },
    { col: "impostos_rs", type: "NUMERIC", nullity: "NULL", desc: "Custo total consolidado de impostos (R$)" },
    { col: "instalacao", type: "TEXT", nullity: "NULL", desc: "Número de instalação físico (referência com nk_uc)" },
    { col: "mes_referencia", type: "TEXT", nullity: "NULL", desc: "Mês/Ano de referência da fatura (ex: '03/2026')" },
    { col: "data_leitura_atualizada", type: "DATE", nullity: "NULL", desc: "Data da leitura atual dos medidores" },
    { col: "data_leitura_anterior", type: "DATE", nullity: "NULL", desc: "Data da leitura anterior dos medidores" },
    { col: "data_leitura_proxima", type: "DATE", nullity: "NULL", desc: "Data prevista para a próxima leitura" },
    { col: "mes_consumo", type: "TEXT", nullity: "NULL", desc: "Mês de consumo referente à fatura" },
    { col: "data_vencimento", type: "DATE", nullity: "NULL", desc: "Data de vencimento da fatura" },
    { col: "data_emissao", type: "DATE", nullity: "NULL", desc: "Data de emissão da fatura" },
    { col: "valor_total_rs", type: "NUMERIC", nullity: "NULL", desc: "Custo total financeiro consolidado da fatura (R$)" },
    { col: "classe", type: "TEXT", nullity: "NULL", desc: "Classe da unidade consumidora (ex: Industrial, Comercial)" },
    { col: "subclasse", type: "TEXT", nullity: "NULL", desc: "Subclasse da unidade consumidora" },
    { col: "subgrupo", type: "TEXT", nullity: "NULL", desc: "Subgrupo de tensão tarifária (ex: A4, B3)" },
    { col: "codigo_barras", type: "TEXT", nullity: "NULL", desc: "Código de barras da fatura para pagamento" },
    { col: "numero_nf", type: "TEXT", nullity: "NULL", desc: "Número da Nota Fiscal da fatura" },
    { col: "consumo_tusd_fora_ponta_rs", type: "NUMERIC", nullity: "NULL", desc: "Valor faturado da TUSD Fora Ponta (R$)" },
    { col: "tarifa_consumo_tusd_fora_ponta", type: "NUMERIC", nullity: "NULL", desc: "Tarifa unitária aplicada à TUSD Fora Ponta" },
    { col: "medida_consumo_tusd_fora_ponta", type: "NUMERIC", nullity: "NULL", desc: "Consumo medido em kWh para TUSD Fora Ponta" },
    { col: "consumo_te_fora_ponta_rs", type: "NUMERIC", nullity: "NULL", desc: "Valor faturado da TE Fora Ponta (R$)" },
    { col: "tarifa_consumo_te_fora_ponta", type: "NUMERIC", nullity: "NULL", desc: "Tarifa unitária aplicada à TE Fora Ponta" },
    { col: "medida_consumo_te_fora_ponta", type: "NUMERIC", nullity: "NULL", desc: "Consumo medido em kWh para TE Fora Ponta" },
    { col: "consumo_te_adicional_bandeira_amarela_rs", type: "NUMERIC", nullity: "NULL", desc: "Custo adicional de bandeira amarela na TE (R$)" },
    { col: "tarifa_consumo_te_adicional_bandeira_amarela", type: "NUMERIC", nullity: "NULL", desc: "Tarifa de adicional de bandeira amarela" },
    { col: "medida_consumo_te_adicional_bandeira_amarela", type: "NUMERIC", nullity: "NULL", desc: "Consumo medido em kWh sob bandeira amarela" },
    { col: "multa_rs", type: "NUMERIC", nullity: "NULL", desc: "Valor cobrado de multa por atraso na fatura (R$)" },
    { col: "juros_mora_rs", type: "NUMERIC", nullity: "NULL", desc: "Valor cobrado de juros de mora (R$)" },
    { col: "atualizacao_monetaria_rs", type: "NUMERIC", nullity: "NULL", desc: "Valor cobrado de atualização monetária (R$)" },
    { col: "ressarcimento_rs", type: "NUMERIC", nullity: "NULL", desc: "Valor de ressarcimento por danos/falhas (R$)" },
    { col: "outros_rs", type: "NUMERIC", nullity: "NULL", desc: "Outros custos e encargos adicionais (R$)" },
    { col: "aliquota_icms", type: "NUMERIC", nullity: "NULL", desc: "Alíquota de ICMS aplicada na fatura (%)" },
    { col: "base_calculo_icms_rs", type: "NUMERIC", nullity: "NULL", desc: "Base de cálculo para ICMS (R$)" },
    { col: "custo_icms_rs", type: "NUMERIC", nullity: "NULL", desc: "Custo total do ICMS destacado (R$)" },
    { col: "aliquota_cofins", type: "NUMERIC", nullity: "NULL", desc: "Alíquota de COFINS aplicada (%)" },
    { col: "base_calculo_cofins_rs", type: "NUMERIC", nullity: "NULL", desc: "Base de cálculo para COFINS (R$)" },
    { col: "custo_cofins_rs", type: "NUMERIC", nullity: "NULL", desc: "Custo total do COFINS destacado (R$)" },
    { col: "aliquota_pis_pasep", type: "NUMERIC", nullity: "NULL", desc: "Alíquota de PIS/PASEP aplicada (%)" },
    { col: "base_calculo_pis_pasep_rs", type: "NUMERIC", nullity: "NULL", desc: "Base de cálculo para PIS/PASEP (R$)" },
    { col: "custo_pis_pasep_rs", type: "NUMERIC", nullity: "NULL", desc: "Custo total do PIS/PASEP destacado (R$)" },
    { col: "servicos_iluminacao_publica_rs", type: "NUMERIC", nullity: "NULL", desc: "Valor da taxa de iluminação pública (R$)" },
    { col: "tarifa_servicos_iluminacao_publica", type: "NUMERIC", nullity: "NULL", desc: "Tarifa unitária da taxa de iluminação pública" },
    { col: "medida_servicos_iluminacao_publica", type: "NUMERIC", nullity: "NULL", desc: "Medida associada à iluminação pública" },
    { col: "soft_delete", type: "BOOLEAN", nullity: "DEFAULT FALSE", desc: "Flag de exclusão lógica (soft delete)" },
    { col: "criado_em", type: "TIMESTAMP", nullity: "DEFAULT NOW()", desc: "Data e hora de criação do registro no banco" }
  ];

  const tableFaturas = new Table({
    rows: [
      new TableRow({
        children: [
          createTableCell("Coluna", true, 20),
          createTableCell("Tipo", true, 20),
          createTableCell("Nulidade", true, 15),
          createTableCell("Detalhamento do Campo", true, 45)
        ]
      }),
      ...faturasCols.map(c => new TableRow({
        children: [
          createTableCell(c.col, false, 20, c.bold || false),
          createTableCell(c.type, false, 20),
          createTableCell(c.nullity, false, 15),
          createTableCell(c.desc, false, 45)
        ]
      }))
    ]
  });
  children.push(tableFaturas);

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== SEÇÃO 4: ENDPOINTS E SERVIÇOS ====================
  children.push(createH1("4. Estrutura do Backend (Endpoints & Serviços)"));
  children.push(createBodyParagraph(
    "A API REST do Audit Energy é estruturada em rotas públicas (como autenticação) e protegidas por autenticação JWT (JSON Web Tokens). O middleware de autorização valida o token contido no cabeçalho HTTP Authorization de cada chamada protegida."
  ));

  children.push(createH2("4.1 Tabela de Rotas da API"));
  
  const routesData = [
    // Auth
    { method: "POST", endpoint: "/api/auth/login", auth: "Público", action: "Autentica credenciais do usuário e retorna token JWT." },
    { method: "GET", endpoint: "/api/auth/me", auth: "JWT Required", action: "Recupera dados do perfil do usuário logado na sessão." },
    { method: "POST", endpoint: "/api/auth/change-password", auth: "JWT Required", action: "Altera a senha do próprio usuário logado." },
    // Users
    { method: "GET", endpoint: "/api/users", auth: "JWT Required", action: "Lista todos os usuários cadastrados na plataforma (Acesso Admin)." },
    { method: "GET", endpoint: "/api/users/:id", auth: "JWT Required", action: "Obtém detalhes cadastrais de um usuário específico (Acesso Admin)." },
    { method: "POST", endpoint: "/api/users", auth: "JWT Required", action: "Cria um novo usuário gerando senha temporária (Acesso Admin)." },
    { method: "PUT", endpoint: "/api/users/:id", auth: "JWT Required", action: "Atualiza os dados de cadastro de um usuário (Acesso Admin)." },
    { method: "DELETE", endpoint: "/api/users/:id", auth: "JWT Required", action: "Exclui permanentemente o registro de um usuário (Acesso Admin)." },
    { method: "POST", endpoint: "/api/users/:id/reset-password", auth: "JWT Required", action: "Reseta a senha de um usuário gerando senha temporária (Acesso Admin)." },
    // Clients
    { method: "GET", endpoint: "/api/clients", auth: "JWT Required", action: "Lista todas as Unidades Consumidoras cadastradas." },
    { method: "GET", endpoint: "/api/clients/:id", auth: "JWT Required", action: "Recupera detalhes técnicos de uma Unidade Consumidora específica." },
    { method: "POST", endpoint: "/api/clients", auth: "JWT Required", action: "Cria uma nova Unidade Consumidora no banco de dados." },
    { method: "POST", endpoint: "/api/clients/bulk", auth: "JWT Required", action: "Importação e criação de múltiplas Unidades Consumidoras em lote." },
    { method: "PUT", endpoint: "/api/clients/:id", auth: "JWT Required", action: "Atualiza os dados técnicos/cadastrais de uma UC." },
    { method: "DELETE", endpoint: "/api/clients/:id", auth: "JWT Required", action: "Exclui uma UC e todos os seus dados vinculados em cascata." },
    // Equipment
    { method: "GET", endpoint: "/api/equipment/client/:clientId", auth: "JWT Required", action: "Lista o inventário de carga completo de uma UC específica." },
    { method: "POST", endpoint: "/api/equipment", auth: "JWT Required", action: "Cadastra um novo equipamento elétrico no inventário da UC." },
    { method: "PUT", endpoint: "/api/equipment/:id", auth: "JWT Required", action: "Atualiza especificações de potência/uso de um equipamento." },
    { method: "DELETE", endpoint: "/api/equipment/:id", auth: "JWT Required", action: "Remove permanentemente um equipamento do inventário." },
    // Faturas
    { method: "GET", endpoint: "/api/faturas", auth: "JWT Required", action: "Recupera o histórico completo de faturas persistidas no banco." },
    { method: "POST", endpoint: "/api/faturas", auth: "JWT Required", action: "Salva ou atualiza uma fatura individual (detecção de duplicidade/soft delete)." },
    { method: "POST", endpoint: "/api/faturas/upload", auth: "JWT Required", action: "Recebe arquivos planilhas de faturas (XLSX, CSV) via multipart para parser." },
    { method: "POST", endpoint: "/api/faturas/sync-powerhub", auth: "JWT Required", action: "Sincroniza faturas seletivas integrando diretamente com o PowerHub da Way2." },
    { method: "DELETE", endpoint: "/api/faturas", auth: "JWT Required", action: "Exclusão administrativa (limpeza técnica) de todas as faturas persistidas." },
    // AI & Email
    { method: "POST", endpoint: "/api/ai/optimize", auth: "JWT Required", action: "Consome os dados de consumo e inventário no Groq para obter recomendações." },
    { method: "POST", endpoint: "/api/email/send-pdf", auth: "JWT Required", action: "Envia o relatório gerado em anexo PDF (Multipart) via e-mail (Nodemailer)." }
  ];

  const tableRoutes = new Table({
    rows: [
      new TableRow({
        children: [
          createTableCell("Método", true, 12, true, AlignmentType.CENTER),
          createTableCell("Endpoint", true, 30, true),
          createTableCell("Proteção", true, 15, true, AlignmentType.CENTER),
          createTableCell("Ação Realizada", true, 43)
        ]
      }),
      ...routesData.map(r => new TableRow({
        children: [
          createTableCell(r.method, false, 12, true, AlignmentType.CENTER),
          createTableCell(r.endpoint, false, 30),
          createTableCell(r.auth, false, 15, false, AlignmentType.CENTER),
          createTableCell(r.action, false, 43)
        ]
      }))
    ]
  });
  children.push(tableRoutes);
  children.push(new Paragraph({ spacing: { before: 100, after: 100 } }));

  children.push(createH2("4.2 Detalhes dos Serviços de Negócio"));
  
  children.push(createH3("FaturaService"));
  children.push(createBodyParagraph(
    "Centraliza a leitura lógica de arquivos binários utilizando bibliotecas XLSX para planilhas e PapaParse para arquivos de texto CSV. Ele mapeia os cabeçalhos literais ('Valor Total R$', 'Impostos R$', 'Instalação') para os campos equivalentes do PostgreSQL, limpando caracteres especiais, convertendo datas em padrões adequados e aplicando normalizações antes da persistência."
  ));
  children.push(createBodyParagraph(
    "Também gerencia o comportamento de conflitos de faturas repetidas através do método saveOrUpdateFatura: se a fatura importada possuir exatamente os mesmos dados da existente, ela é ignorada; se possuir dados divergentes no mesmo período de instalação, a fatura antiga é marcada logicamente como deletada (soft delete) e a nova versão é inserida."
  ));

  children.push(createH3("PowerHubService"));
  children.push(createBodyParagraph(
    "Desenvolvido especificamente para integrar a API RESTful PowerHub da Way2. A integração realiza uma iteração paginada através de parâmetros HTTP $top e $skip. Para cada item da lista principal de faturas retornadas, o serviço realiza uma segunda requisição ao endpoint de detalhes (/items/{id}) para recuperar os campos analíticos das sub-leituras, tais como consumos TUSD/TE medidos, tarifas de impostos (ICMS, COFINS, PIS) e serviços adicionais como iluminação pública e multas de atraso."
  ));

  children.push(createH3("AIService"));
  children.push(createBodyParagraph(
    "Responsável por criar a comunicação com o motor de linguagem LLaMA-3.3-70b-versatile via provedor Groq. O serviço monta uma carga útil (payload) altamente técnica estruturada em tópicos de controle: Análise de Conformidade (baseada em distorção numérica), Variação Mês a Mês, Diagnóstico Tributário e Oportunidades Práticas de Otimização. O prompt injeta os dados reais da fatura, o consumo histórico do período anterior (para cálculo de variação percentual) e o inventário de carga associado para direcionar a IA em conselhos precisos sobre o comportamento energético da UC."
  ));

  children.push(createH3("EmailService"));
  children.push(createBodyParagraph(
    "Utiliza a biblioteca Nodemailer com as credenciais SMTP definidas no arquivo de ambiente (.env) para disparar relatórios técnicos formatados em PDF anexados diretamente na mensagem do usuário. A chamada recebe o buffer do PDF gerado pelo cliente, encapsula-o como anexo MIME com o cabeçalho apropriado e executa a entrega ao destinatário configurado."
  ));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== SEÇÃO 5: FRONTEND ====================
  children.push(createH1("5. Estrutura do Frontend (Páginas, Componentes & Roteamento)"));
  children.push(createBodyParagraph(
    "O frontend é projetado usando React 19 em conjunto com Vite. O roteamento dinâmico utiliza o TanStack Router, cujas definições de arquivos geram tipagem em tempo de compilação em src/routeTree.gen.ts, diminuindo erros de caminhos de links quebrados."
  ));

  children.push(createH2("5.1 Páginas do Sistema"));
  children.push(createBulletPoint(" Ponto de entrada após login. Apresenta indicadores consolidados de faturamento, consumo global em kWh, carga tributária média e gráficos de gastos por distribuidora e histórico de consumo.", "HomePage:"));
  children.push(createBulletPoint(" Tela de controle de acesso segura. Implementa a autenticação com JWT e redireciona usuários não autenticados das rotas privadas. Se a senha de login for detectada como temporária (iniciada com 'Tmp#'), o sistema força a imediata exibição do formulário de redefinição de senha obrigatória.", "LoginPage:"));
  children.push(createBulletPoint(" Exibe e gerencia a listagem das Unidades Consumidoras. Fornece diálogos de cadastro, edição e importação em lote de clientes.", "ClientsPage:"));
  children.push(createBulletPoint(" Mapeamento do inventário físico associado a cada UC. Permite cadastrar potência, tempo de uso e quantidades para simular o consumo teórico.", "EquipmentPage:"));
  children.push(createBulletPoint(" Fornece os controles para carregar planilhas locais e invocar a sincronização remota via API PowerHub.", "ImportPage:"));
  children.push(createBulletPoint(" Tabela das faturas em memória na sessão de importação atual (dados recém-enviados). Oferece customização de colunas visíveis, paginação e estatísticas imediatas das faturas importadas antes de salvá-las no banco.", "DataPage (Faturas da Sessão):"));
  children.push(createBulletPoint(" Histórico de faturas persistidas no banco de dados. Permite pesquisa por UC, filtros por colunas, ordenação dinâmica por campos técnicos de consumo e disparo da sincronização seletiva com o PowerHub.", "FaturasPage (Histórico de Faturas):"));
  children.push(createBulletPoint(" Módulo de geração e visualização de relatórios. Coleta dados de faturas, solicita insights de IA do backend e renderiza o PDFDocument, permitindo downloads em lote ou disparo de e-mails.", "PDFPage (Painel de Relatórios):"));
  children.push(createBulletPoint(" Painel administrativo exclusivo para usuários administradores. Permite criar usuários, desativar cadastros e gerar senhas temporárias (incluindo funcionalidade de reset de senha).", "UsersPage:"));

  children.push(createH2("5.2 Componentes Modulares por Domínio"));

  children.push(createH3("Componentes de Layout & Navegação"));
  children.push(createBulletPoint(" Componente de barra lateral retrátil com atalhos de navegação e menu de ações do usuário.", "Sidebar:"));
  children.push(createBulletPoint(" Cabeçalho superior contendo título da página atual, indicadores rápidos e atalho de perfil.", "Header:"));
  children.push(createBulletPoint(" Item de perfil do usuário logado na barra de navegação que expõe o botão de logout e alteração de senha.", "NavUser:"));
  children.push(createBulletPoint(" Diálogo flutuante para troca de senha de acesso do usuário, exigindo senha atual e validações.", "ChangePasswordDialog:"));

  children.push(createH3("Componentes de Clientes"));
  children.push(createBulletPoint(" Formulário modal para criação e edição de Unidades Consumidoras.", "ClientDialog:"));
  children.push(createBulletPoint(" Menu de seleção rápida de clientes, permitindo filtrar faturas por UC específica.", "ClientSelector:"));
  children.push(createBulletPoint(" Estado vazio exibido quando não há clientes cadastrados no banco.", "ClientsEmptyState:"));
  children.push(createBulletPoint(" Tabela estruturada para exibição dos dados das UCs com paginação e ordenação.", "ClientsTable:"));

  children.push(createH3("Componentes de Equipamentos"));
  children.push(createBulletPoint(" Formulário modal para cadastro de dispositivos com cálculos automáticos de Wh/dia e potência.", "EquipmentDialog:"));
  children.push(createBulletPoint(" Estado vazio exibido quando a UC selecionada não possui equipamentos mapeados.", "EquipmentEmptyState:"));
  children.push(createBulletPoint(" Tabela com ações de edição/remoção dos equipamentos do inventário.", "EquipmentTable:"));

  children.push(createH3("Componentes de Faturas & Upload"));
  children.push(createBulletPoint(" Diálogo de parametrização da sincronização PowerHub (seleção de UC e competência).", "FaturaSyncDialog:"));
  children.push(createBulletPoint(" Tabela dedicada a exibir faturas persistidas no histórico do banco, com filtros dinâmicos por coluna.", "FaturaHistoryTable:"));
  children.push(createBulletPoint(" Zona de drag-and-drop avançada para upload e processamento de planilhas locais.", "FileUpload:"));

  children.push(createH3("Componentes de Dados (Sessão de Importação)"));
  children.push(createBulletPoint(" Painel de estatísticas agregadas das faturas da sessão (total faturado, consumo kWh, impostos).", "DataStats:"));
  children.push(createBulletPoint(" Tabela de dados de pré-visualização das planilhas importadas na sessão corrente.", "DataTable:"));
  children.push(createBulletPoint(" Permite ocultar ou exibir dinamicamente colunas de faturas na tabela para facilitar a análise.", "ColumnCustomizer:"));
  children.push(createBulletPoint(" Diálogo modal contendo checkboxes para selecionar quais colunas técnicas devem estar visíveis ou ocultas no grid de visualização.", "TableColumnFilter:"));
  children.push(createBulletPoint(" Paginação reativa para tabelas de grande volume.", "DataPagination:"));

  children.push(createH3("Estrutura do Relatório PDF (pdf/document)"));
  children.push(createBodyParagraph(
    "O Audit Energy gera relatórios ricos em formato PDF no cliente. Para manter o código modular, o componente principal PDFDocument é composto por sub-módulos especializados:"
  ));
  children.push(createBulletPoint(" Renderiza o cabeçalho oficial com dados da UC, distribuidora, número NF e período de faturamento.", "PDFHeader:"));
  children.push(createBulletPoint(" Renderiza o rodapé com numeração de páginas e termos de confidencialidade.", "PDFFooter:"));
  children.push(createBulletPoint(" Caixa de indicadores financeiros principais (Valor total, tributos, custos fixos).", "KPIBox:"));
  children.push(createBulletPoint(" Rápido sumário textual sobre o resultado geral da auditoria daquele mês.", "ExecutiveSummary:"));
  children.push(createBulletPoint(" Exibe os dados numéricos brutos da fatura em tabelas organizadas do PDF.", "DataTable:"));
  children.push(createBulletPoint(" Compara o consumo faturado contra o consumo simulado em campo (inventário).", "BenchmarkTable:"));
  children.push(createBulletPoint(" Plota a barra de progresso ou medidor de eficiência do cliente baseado na distorção identificada.", "EfficiencyScore:"));
  children.push(createBulletPoint(" Renderiza gráficos históricos de consumo e custos nos eixos mensais.", "ChartBlock:"));
  children.push(createBulletPoint(" Apresenta cards visuais para destacar pontos específicos observados na auditoria.", "InsightCard:"));
  children.push(createBulletPoint(" Renderiza a linha do tempo ou histórico de consumo das faturas anteriores.", "TimelineBlock:"));
  children.push(createBulletPoint(" Bloco formatado em Markdown que renderiza as sugestões de economia geradas pelo LLaMA.", "AIInsights:"));
  children.push(createBulletPoint(" Helper de estilização de títulos de seções internas do PDF.", "SectionTitle:"));
  children.push(createBulletPoint(" Painel interativo para pré-visualizar as páginas geradas em tempo real antes de exportar ou enviar.", "PDFPreview:"));
  children.push(createBulletPoint(" Estado neutro exibido quando nenhuma fatura ou período de faturamento foi selecionado.", "PDFEmptyState:"));
  children.push(createBulletPoint(" Card resumo que exibe informações consolidadas da UC a ser exportada para o PDF.", "PDFReportCard:"));

  children.push(createH2("5.3 Provedores de Contexto (Contexts)"));
  children.push(createBulletPoint(" Gerencia o token JWT e sessões, mantendo o estado de login e autenticação privada.", "AuthContext:"));
  children.push(createBulletPoint(" Centraliza requisições HTTP e sincronizações (faturas, clientes, equipamentos e usuários) através de cache reativo (React Query / Custom Hooks). Mantém o estado temporário de uploads de faturas via useReducer.", "DataContext:"));
  children.push(createBulletPoint(" Controla as seleções temporárias de linhas da tabela para ações em lote no painel de relatórios.", "PDFContext:"));
  children.push(createBulletPoint(" Implementa caixas de diálogo flutuantes, modais de confirmação de exclusões e toasts customizados.", "AlertContext:"));
  children.push(createBulletPoint(" Gerencia configurações globais da aplicação frontend (ex: tema escuro/claro).", "AppContext:"));

  children.push(createH2("5.4 Hooks Customizados (TanStack Query)"));
  children.push(createBulletPoint(" Encapsula consultas de busca, inserção, atualização e exclusão de Unidades Consumidoras com invalidação automática de cache.", "useClients:"));
  children.push(createBulletPoint(" Gerencia o inventário de equipamentos por UC, sincronizando atualizações de carga no banco de dados.", "useEquipment:"));
  children.push(createBulletPoint(" Abstrai a listagem histórica, inserção individual, upload de planilhas e sincronização PowerHub.", "useFaturas:"));
  children.push(createBulletPoint(" Controla operações administrativas de listagem, criação, redefinição de senha e exclusão de usuários.", "useUsers:"));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== SEÇÃO 6: INTEGRAÇÕES ====================
  children.push(createH1("6. Integrações do Sistema"));
  children.push(createBodyParagraph(
    "A aplicação integra-se de forma ativa com sistemas externos para enriquecer seu ecossistema técnico. Essas integrações são executadas exclusivamente pela camada de serviço do servidor backend para garantir a segurança das chaves secretas de acesso."
  ));

  children.push(createH2("6.1 API Way2 PowerHub"));
  children.push(createBodyParagraph(
    "A Way2 provê um repositório centralizado de medição de faturas elétricas. O Audit Energy conecta-se ao endpoint REST da API PowerHub fornecendo chaves criptográficas x-way2-key personalizadas registradas no ambiente do servidor."
  ));
  children.push(createBodyParagraph(
    "Devido ao grande volume de informações, a importação é dividida em blocos paginados de 100 faturas por iteração. Como a API externa possui uma estrutura genérica de faturamento, a camada PowerHubService realiza mapeamentos dinâmicos, convertendo itens genéricos da fatura para os campos específicos de consumo TUSD, consumo TE, tarifas e impostos exigidos pelo sistema de auditoria."
  ));

  children.push(createH2("6.2 API Groq (LLaMA 3.3 70B)"));
  children.push(createBodyParagraph(
    "O Audit Energy utiliza o modelo avançado 'llama-3.3-70b-versatile' da Groq devido a sua baixíssima latência e alta precisão em língua portuguesa. O fluxo de análise inicia ao coletar o perfil elétrico registrado na fatura (consumo total, tributos cobrados, etc.) e o confronta com os dados acumulados do inventário de campo cadastrado pelo técnico."
  ));
  children.push(createBodyParagraph(
    "A IA atua determinando se o desvio técnico de consumo está dentro de limites aceitáveis (inferior a 10%) e lista de maneira detalhada e embasada as prováveis causas físicas para distorções maiores. O resultado final gerado em formato Markdown é inserido no relatório PDF formatado com gráficos e sumários técnicos de eficiência."
  ));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== SEÇÃO 7: INSTALAÇÃO E EXECUÇÃO ====================
  children.push(createH1("7. Guia de Instalação e Execução"));
  children.push(createBodyParagraph(
    "Esta seção descreve os procedimentos para instalar as dependências e iniciar a execução da plataforma de auditoria em ambientes locais de desenvolvimento."
  ));

  children.push(createH2("7.1 Configurações de Variáveis de Ambiente"));
  children.push(createBodyParagraph("Crie um arquivo .env no diretório server/ com as seguintes chaves de configuração:"));
  children.push(createBulletPoint(" Porta utilizada para subir a API Express (Default: 3001).", "PORT:"));
  children.push(createBulletPoint(" URL do PostgreSQL de desenvolvimento.", "DATABASE_URL:"));
  children.push(createBulletPoint(" Chave secreta de hashing utilizada para assinar os tokens JWT.", "JWT_SECRET:"));
  children.push(createBulletPoint(" Token secreto fornecido pela Way2 para consultar faturas do PowerHub.", "POWERHUB_API_KEY:"));
  children.push(createBulletPoint(" URL base da API REST da Way2.", "POWERHUB_API_URL:"));
  children.push(createBulletPoint(" Chave de autenticação gerada no painel de desenvolvedor da Groq.", "GROQ_API_KEY:"));
  children.push(createBulletPoint(" Configuração de SMTP do serviço de e-mails (Host, Port, User, Pass).", "SMTP_HOST / SMTP_USER / etc:"));

  children.push(createH2("7.2 Comandos de Inicialização (Backend)"));
  children.push(createBodyParagraph("Abra o terminal no diretório server/ e execute:"));
  children.push(createBulletPoint(" npm install", "Instalar dependências:"));
  children.push(createBulletPoint(" npm run dev", "Iniciar em desenvolvimento:"));
  children.push(createBodyParagraph("O servidor Express iniciará na porta configurada e tentará se conectar com o banco de dados PostgreSQL. As tabelas necessárias serão criadas automaticamente se não existirem na base de dados conectada."));

  children.push(createH2("7.3 Comandos de Inicialização (Frontend)"));
  children.push(createBodyParagraph("Abra o terminal no diretório raiz do projeto e execute:"));
  children.push(createBulletPoint(" npm install", "Instalar dependências:"));
  children.push(createBulletPoint(" npm run dev", "Iniciar servidor Vite:"));
  children.push(createBodyParagraph("O Vite subirá o servidor de desenvolvimento no endereço local (ex: http://localhost:5173)."));

  // Criar Documento
  const doc = new Document({
    sections: [{
      properties: {},
      children: children
    }]
  });

  return doc;
}

async function run() {
  console.log("Iniciando geração da documentação técnica...");
  try {
    const doc = buildDocument();
    
    // Gerar o buffer binário
    const buffer = await Packer.toBuffer(doc);
    
    // Salvar o arquivo no diretório raiz
    let outputPath = path.join(process.cwd(), 'documentacao_tecnica_audit_energy.docx');
    try {
      fs.writeFileSync(outputPath, buffer);
    } catch (writeError) {
      if (writeError.code === 'EBUSY') {
        console.warn("Aviso: O arquivo principal está bloqueado ou aberto por outro programa.");
        outputPath = path.join(process.cwd(), 'documentacao_tecnica_audit_energy_atualizada.docx');
        console.log(`Tentando salvar em arquivo alternativo: ${outputPath}`);
        fs.writeFileSync(outputPath, buffer);
      } else {
        throw writeError;
      }
    }
    
    console.log(`Documentação gerada com sucesso em: ${outputPath}`);
    console.log(`Tamanho do arquivo: ${(buffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("Erro ao gerar a documentação:", error);
    process.exit(1);
  }
}

run();
