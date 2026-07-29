/**
 * Interface Strategy para compactação de tabelas por UF.
 *
 * Cada estado que possui lógica de processamento específica implementa
 * esta interface. O TextractCompactor (orquestrador) delega o processamento
 * para a implementação correta com base no UF.
 */

import type { CompactorState } from './types';
import type { TextractBlock } from './types';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface UFCompactorStrategy {
  readonly uf: string;

  /**
   * Compacta uma tabela bruta (array 2D de strings) conforme as regras do estado.
   * Retorna a tabela filtrada/transformada (incluindo headers na posição 0).
   */
  compactTable(
    table: string[][],
    state: CompactorState
  ): string[][];

  /**
   * Ordena blocos de página conforme layout do estado.
   * Ex: SE ordena primeiro coluna esquerda, depois direita.
   * Default: ordena por Top, depois por Left.
   */
  sortPageBlocks(blocks: TextractBlock[]): TextractBlock[];

  /**
   * Atualiza estado com base em blocos LINE (subcabeçalhos, seções).
   * Chamado para cada bloco LINE durante iteração da página.
   * @returns true se o bloco foi processado como subcabeçalho (não é dados)
   */
  processLineBlock(text: string, columnKey: 'left' | 'right', state: CompactorState): boolean;

  /**
   * Cria o estado inicial para processamento de blocos.
   * Ex: SE cria estados independentes para coluna esquerda e direita.
   */
  createInitialState(): Record<string, CompactorState>;

  /**
   * Se true, o processamento de LINE blocks para tracking de estado é habilitado.
   */
  readonly needsLineTracking: boolean;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

import { MGCompactor } from './MGCompactor';
import { PRCompactor } from './PRCompactor';
import { SECompactor } from './SECompactor';
import { ALCompactor } from './ALCompactor';
import { APCompactor } from './APCompactor';
import { DFCompactor } from './DFCompactor';
import { MACompactor } from './MACompactor';
import { MTCompactor } from './MTCompactor';
import { PACompactor } from './PACompactor';
import { PECompactor } from './PECompactor';
import { PICompactor } from './PICompactor';
import { RNCompactor } from './RNCompactor';
import { ROCompactor } from './ROCompactor';
import { GenericCompactor } from './GenericCompactor';

const compactorRegistry: Record<string, UFCompactorStrategy> = {
  MG: new MGCompactor(),
  PR: new PRCompactor(),
  SE: new SECompactor(),
  AL: new ALCompactor(),
  AP: new APCompactor(),
  DF: new DFCompactor(),
  MA: new MACompactor(),
  MT: new MTCompactor(),
  PA: new PACompactor(),
  PE: new PECompactor(),
  PI: new PICompactor(),
  RN: new RNCompactor(),
  RO: new ROCompactor(),
};

import { isSubheaderSE, isNonBeerSubheader } from './textractNormalize';

export class ConfigurableCompactor implements UFCompactorStrategy {
  readonly uf: string;
  private baseCompactor: UFCompactorStrategy;
  private features: {
    split_2_columns?: boolean;
    parallel_tables_split?: boolean;
    matrix_header?: boolean;
    subheaders?: boolean;
    ignore_noise?: boolean;
  };

  constructor(uf: string, baseCompactor: UFCompactorStrategy, features?: any) {
    this.uf = uf;
    this.baseCompactor = baseCompactor;
    this.features = features || {};
  }

  get needsLineTracking(): boolean {
    if (this.features.subheaders !== undefined) {
      return !!this.features.subheaders;
    }
    return this.baseCompactor.needsLineTracking;
  }

  compactTable(table: string[][], state: CompactorState): string[][] {
    if (!table || table.length === 0) return [];

    // Se parallel_tables_split estiver explicitamente ativado e a tabela for dupla (11+ cols)
    if (this.features.parallel_tables_split && table[0] && table[0].length >= 11) {
      const mgCompactor = new MGCompactor();
      return mgCompactor.compactTable(table, state);
    }

    return this.baseCompactor.compactTable(table, state);
  }

  sortPageBlocks(blocks: TextractBlock[]): TextractBlock[] {
    return this.baseCompactor.sortPageBlocks(blocks);
  }

  processLineBlock(text: string, columnKey: 'left' | 'right', state: CompactorState): boolean {
    if (this.features.subheaders) {
      if (this.baseCompactor.needsLineTracking) {
        return this.baseCompactor.processLineBlock(text, columnKey, state);
      }
      if (isNonBeerSubheader(text)) {
        state.isBeerSection = false;
        state.currentSubheader = '';
        return true;
      }
      if (isSubheaderSE(text)) {
        state.isBeerSection = true;
        state.currentSubheader = text;
        return true;
      }
    }
    return this.baseCompactor.processLineBlock(text, columnKey, state);
  }

  createInitialState(): Record<string, CompactorState> {
    const baseState = this.baseCompactor.createInitialState();
    if (!baseState || typeof baseState !== 'object') {
      return { left: { currentSubheader: '', isBeerSection: true } };
    }
    return baseState;
  }
}

/**
 * Retorna a implementação de compactação adequada para o estado (UF).
 * Se houver configurações personalizadas (features), envelopa no ConfigurableCompactor.
 */
export function getCompactorForUF(uf: string, features?: any): UFCompactorStrategy {
  const ufUpper = (uf || '').toUpperCase();
  const baseCompactor = compactorRegistry[ufUpper] || new GenericCompactor(ufUpper);

  if (features && typeof features === 'object' && Object.keys(features).length > 0) {
    return new ConfigurableCompactor(ufUpper, baseCompactor, features);
  }

  return baseCompactor;
}

