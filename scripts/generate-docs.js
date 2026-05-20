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
  children.push(createMetaInfo("Versão", "1.0.0"));
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
  children.push(createBulletPoint(" Runtime moderno e performático para o desenvolvimento backend.", "Node.js (v24.15):"));
  children.push(createBulletPoint(" Framework minimalista e eficiente para construção das rotas e controladores HTTP.", "Express.js:"));
  children.push(createBulletPoint(" Linguagem tipada que eleva a robustez e previne erros comuns durante a codificação.", "TypeScript (v5.8.2):"));
  children.push(createBulletPoint(" Banco de dados relacional que suporta alta carga de transações e consultas complexas.", "PostgreSQL:"));
  children.push(createBulletPoint(" Ferramenta de execução e transpilação rápida de arquivos TypeScript para desenvolvimento.", "tsx (watch mode):"));
  children.push(createBulletPoint(" Criptografia de senhas usando hashing SHA-256 salteado.", "Bcrypt.js:"));
  children.push(createBulletPoint(" Integração com a API de LLM da Groq (Llama-3.3-70b-versatile) para a geração automatizada de insights.", "Integração Groq:"));

  children.push(createH2("2.2 Tecnologias do Frontend"));
  children.push(createBulletPoint(" Biblioteca declarativa para renderização de interfaces reativas baseadas em componentes.", "React (v19.0):"));
  children.push(createBulletPoint(" Ferramenta de build ultra-rápida baseada em ESBuild.", "Vite:"));
  children.push(createBulletPoint(" Roteador com segurança de tipos (Type-safe router) que facilita o gerenciamento de rotas complexas.", "TanStack React Router:"));
  children.push(createBulletPoint(" Gerenciamento de estado assíncrono e cacheamento de requisições de API.", "TanStack React Query:"));
  children.push(createBulletPoint(" Framework de estilos em CSS utilitário para layouts limpos e responsivos.", "TailwindCSS (v4.0):"));
  children.push(createBulletPoint(" Componentes visuais acessíveis e consistentes baseados no Radix UI e estilizados via Tailwind.", "Shadcn UI:"));
  children.push(createBulletPoint(" Geração de PDFs complexos diretamente no navegador a partir de componentes React JSX.", "@react-pdf/renderer:"));

  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ==================== SEÇÃO 3: BANCO DE DADOS ====================
  children.push(createH1("3. Modelagem do Banco de Dados"));
  children.push(createBodyParagraph(
    "O banco de dados PostgreSQL armazena as entidades de usuários, clientes (unidades consumidoras), equipamentos físicos (inventário de carga) e faturas elétricas. A seguir são detalhados os esquemas de cada tabela."
  ));

  // Tabela: users
  children.push(createH2("3.1 Tabela: users"));
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
          createTableCell("id", false, 20, true),
          createTableCell("SERIAL", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Chave primária autoincrementada", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("name", false, 20, true),
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
          createTableCell("password", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Hash da senha (bcrypt)", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("role", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("DEFAULT 'user'", false, 15),
          createTableCell("Papel de autorização ('admin' ou 'user')", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("active", false, 20, true),
          createTableCell("BOOLEAN", false, 25),
          createTableCell("DEFAULT true", false, 15),
          createTableCell("Indica se o cadastro está ativo no sistema", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("created_at", false, 20, true),
          createTableCell("TIMESTAMP", false, 25),
          createTableCell("DEFAULT NOW()", false, 15),
          createTableCell("Data e hora de criação do usuário", false, 40)
        ]
      })
    ]
  });
  children.push(tableUsers);
  children.push(new Paragraph({ spacing: { before: 100, after: 100 } }));

  // Tabela: clients
  children.push(createH2("3.2 Tabela: clients"));
  children.push(createBodyParagraph("Armazena as Unidades Consumidoras de energia. Cada registro representa um local de auditoria."));

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
      new TableRow({
        children: [
          createTableCell("id", false, 20, true),
          createTableCell("SERIAL", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Chave primária autoincrementada", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("uc_number", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NULL", false, 15),
          createTableCell("Número da Unidade Consumidora (Identificador Único)", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("name", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Razão Social ou Nome do Site do Cliente", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("distributor", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NULL", false, 15),
          createTableCell("Distribuidora de energia (ex: Light, Enel)", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("subgroup", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NULL", false, 15),
          createTableCell("Subgrupo de tensão tarifária (ex: A4, B3)", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("cnpj", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NULL", false, 15),
          createTableCell("CNPJ da Unidade Consumidora", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("contact_email", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NULL", false, 15),
          createTableCell("E-mail de contato para envio do relatório PDF", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("cep / uf / city", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NULL", false, 15),
          createTableCell("Dados de localização e endereço do site", false, 40)
        ]
      })
    ]
  });
  children.push(tableClients);
  children.push(new Paragraph({ spacing: { before: 100, after: 100 } }));

  // Tabela: equipment
  children.push(createH2("3.3 Tabela: equipment"));
  children.push(createBodyParagraph("Contém o inventário de dispositivos elétricos de campo associados a um determinado cliente/UC."));

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
      new TableRow({
        children: [
          createTableCell("id", false, 20, true),
          createTableCell("SERIAL", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Chave primária", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("client_id", false, 20, true),
          createTableCell("INTEGER", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Chave estrangeira referenciando clients(id)", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("name", false, 20, true),
          createTableCell("TEXT", false, 25),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Nome do equipamento (ex: Motor 15 CV)", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("power_w", false, 20, true),
          createTableCell("NUMERIC", false, 25),
          createTableCell("DEFAULT 0", false, 15),
          createTableCell("Potência nominal do dispositivo em Watts", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("hours_per_day", false, 20, true),
          createTableCell("NUMERIC", false, 25),
          createTableCell("DEFAULT 0", false, 15),
          createTableCell("Estimativa de uso diário em horas", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("quantity", false, 20, true),
          createTableCell("INTEGER", false, 25),
          createTableCell("DEFAULT 1", false, 15),
          createTableCell("Quantidade de unidades idênticas do equipamento", false, 40)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("tariff", false, 20, true),
          createTableCell("NUMERIC", false, 25),
          createTableCell("DEFAULT 0", false, 15),
          createTableCell("Custo tarifário aplicado por kWh (R$)", false, 40)
        ]
      })
    ]
  });
  children.push(tableEquipment);
  children.push(new Paragraph({ spacing: { before: 100, after: 100 } }));

  // Tabela: faturas
  children.push(createH2("3.4 Tabela: faturas"));
  children.push(createBodyParagraph(
    "Esta tabela possui grande dimensionalidade de colunas para suportar todos os campos que podem ser extraídos de planilhas complexas de auditoria energética ou da API PowerHub da Way2."
  ));

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
      new TableRow({
        children: [
          createTableCell("id", false, 20, true),
          createTableCell("SERIAL", false, 20),
          createTableCell("NOT NULL", false, 15),
          createTableCell("Chave primária do sistema", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("nome_do_site", false, 20, true),
          createTableCell("TEXT", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Nome identificador da planta/instalação", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("nome_do_cliente", false, 20, true),
          createTableCell("TEXT", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Razão social do cliente associado", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("fonte", false, 20, true),
          createTableCell("TEXT", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Origem da fatura ('Excel', 'CSV', 'PowerHUB')", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("instalacao", false, 20, true),
          createTableCell("TEXT", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Número de instalação físico (referência com uc_number)", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("mes_referencia", false, 20, true),
          createTableCell("TEXT", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Mês de faturamento (ex: '03/2026')", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("valor_total_rs", false, 20, true),
          createTableCell("NUMERIC", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Custo financeiro consolidado da fatura (R$)", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("medida_consumo_tusd_fora_ponta", false, 20, true),
          createTableCell("NUMERIC", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Consumo medido em kWh do componente TUSD Fora Ponta", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("medida_consumo_te_fora_ponta", false, 20, true),
          createTableCell("NUMERIC", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Consumo medido em kWh do componente TE Fora Ponta", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("custo_icms_rs / cofins_rs / pis_pasep_rs", false, 20, true),
          createTableCell("NUMERIC", false, 20),
          createTableCell("NULL", false, 15),
          createTableCell("Detalhamento de tributos e tarifas de impostos da fatura", false, 45)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("D_E_L_E_T_", false, 20, true),
          createTableCell("BOOLEAN", false, 20),
          createTableCell("DEFAULT FALSE", false, 15),
          createTableCell("Campo de exclusão lógica (soft delete) para reimportações", false, 45)
        ]
      })
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
      new TableRow({
        children: [
          createTableCell("POST", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/auth/register", false, 30),
          createTableCell("Público", false, 15, false, AlignmentType.CENTER),
          createTableCell("Cadastra um novo usuário no banco de dados.", false, 43)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("POST", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/auth/login", false, 30),
          createTableCell("Público", false, 15, false, AlignmentType.CENTER),
          createTableCell("Autentica credenciais e gera o Token JWT para a sessão.", false, 43)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("GET", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/clients", false, 30),
          createTableCell("JWT Required", false, 15, false, AlignmentType.CENTER),
          createTableCell("Recupera a lista completa de clientes cadastrados.", false, 43)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("POST", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/clients", false, 30),
          createTableCell("JWT Required", false, 15, false, AlignmentType.CENTER),
          createTableCell("Cria ou atualiza um cliente em lote.", false, 43)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("POST", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/equipment", false, 30),
          createTableCell("JWT Required", false, 15, false, AlignmentType.CENTER),
          createTableCell("Cadastra ou atualiza equipamento no inventário de um cliente.", false, 43)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("POST", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/faturas/upload", false, 30),
          createTableCell("JWT Required", false, 15, false, AlignmentType.CENTER),
          createTableCell("Faz upload físico e parseia planilhas de faturas (XLSX, CSV).", false, 43)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("POST", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/faturas/sync", false, 30),
          createTableCell("JWT Required", false, 15, false, AlignmentType.CENTER),
          createTableCell("Sincroniza faturas diretamente a partir da API PowerHub.", false, 43)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("POST", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/ai/optimize", false, 30),
          createTableCell("JWT Required", false, 15, false, AlignmentType.CENTER),
          createTableCell("Envia dados de consumo para Groq LLM e retorna conselhos de eficiência.", false, 43)
        ]
      }),
      new TableRow({
        children: [
          createTableCell("POST", false, 12, true, AlignmentType.CENTER),
          createTableCell("/api/email/send-pdf", false, 30),
          createTableCell("Público", false, 15, false, AlignmentType.CENTER),
          createTableCell("Recebe o arquivo PDF em binário (Multipart) e envia via Nodemailer.", false, 43)
        ]
      })
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
  children.push(createBulletPoint(" Tela de controle de acesso segura. Implementa a autenticação com JWT e redireciona usuários não autenticados das rotas privadas.", "LoginPage:"));
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
  children.push(createBulletPoint(" Paginação reativa para tabelas de grande volume.", "DataPagination:"));

  children.push(createH3("Estrutura do Relatório PDF (pdf/document)"));
  children.push(createBodyParagraph(
    "O Audit Energy gera relatórios ricos em formato PDF no cliente. Para manter o código modular, o componente principal PDFDocument é composto por 12 sub-módulos especializados:"
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

  children.push(createH2("5.3 Provedores de Contexto (Contexts)"));
  children.push(createBulletPoint(" Gerencia o token JWT e sessões, mantendo o estado de login e autenticação privada.", "AuthContext:"));
  children.push(createBulletPoint(" Centraliza requisições HTTP e sincronizações (faturas, clientes, equipamentos e usuários) através de cache reativo (React Query / Custom Hooks). Mantém o estado temporário de uploads de faturas via useReducer.", "DataContext:"));
  children.push(createBulletPoint(" Controla as seleções temporárias de linhas da tabela para ações em lote no painel de relatórios.", "PDFContext:"));
  children.push(createBulletPoint(" Implementa caixas de diálogo flutuantes, modais de confirmação de exclusões e toasts customizados.", "AlertContext:"));
  children.push(createBulletPoint(" Gerencia configurações globais da aplicação frontend (ex: tema escuro/claro).", "AppContext:"));

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
