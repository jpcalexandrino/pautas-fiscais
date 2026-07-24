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
import { GenericCompactor } from './GenericCompactor';

const compactorRegistry: Record<string, UFCompactorStrategy> = {
  MG: new MGCompactor(),
  PR: new PRCompactor(),
  SE: new SECompactor(),
};

/**
 * Retorna a implementação de compactação adequada para o estado (UF).
 * Se não houver implementação específica, retorna o compactor genérico.
 */
export function getCompactorForUF(uf: string): UFCompactorStrategy {
  const ufUpper = uf.toUpperCase();
  return compactorRegistry[ufUpper] || new GenericCompactor(ufUpper);
}
