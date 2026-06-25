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
  name: 'Pautas Fiscais',
  version: '1.0.0',
  description: 'Sistema de Classificação e Gestão de Pautas Fiscais',
  locale: 'pt-BR',
  currency: 'BRL',
};

export const BRAND_SLUGS: string[] = [
  'imperio',
  'império',
  'cidade imperial',
  'puro malte pilsen',
  '3.0',
];

