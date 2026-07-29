/**
 * Tipos e interfaces centralizados para o pipeline de compactação do Textract.
 *
 * Substitui o uso de `any` espalhado pelo TextractCompactor original,
 * garantindo tipagem forte para blocos do Textract, estado do compactor
 * e resultados de tabela.
 */

// ---------------------------------------------------------------------------
// Textract Block Types
// ---------------------------------------------------------------------------

export interface TextractBoundingBox {
  Width: number;
  Height: number;
  Left: number;
  Top: number;
}

export interface TextractGeometry {
  BoundingBox: TextractBoundingBox;
  Polygon?: Array<{ X: number; Y: number }>;
}

export interface TextractRelationship {
  Type: 'CHILD' | 'VALUE' | 'COMPLEX_FEATURES';
  Ids: string[];
}

export type TextractBlockType =
  | 'PAGE'
  | 'LINE'
  | 'WORD'
  | 'TABLE'
  | 'CELL'
  | 'MERGED_CELL'
  | 'KEY_VALUE_SET'
  | 'SELECTION_ELEMENT'
  | 'SIGNATURE'
  | 'QUERY'
  | 'QUERY_RESULT';

export interface TextractBlock {
  BlockType: TextractBlockType;
  Id: string;
  Text?: string;
  Confidence?: number;
  Page?: number;
  Geometry?: TextractGeometry;
  Relationships?: TextractRelationship[];
  RowIndex?: number;
  ColumnIndex?: number;
  RowSpan?: number;
  ColumnSpan?: number;
  EntityTypes?: string[];
}

// ---------------------------------------------------------------------------
// Compactor Output
// ---------------------------------------------------------------------------

/** Representa uma tabela extraída e estruturada do Textract. */
export interface EstruturaTabela {
  tabelaIndex: number;
  pagina: number;
  headers: string[];
  rows: string[][];
}

// ---------------------------------------------------------------------------
// Compactor State
// ---------------------------------------------------------------------------

/** Estado compartilhado entre processamento de blocos por coluna/seção. */
export interface CompactorState {
  currentSubheader?: string;
  isBeerSection?: boolean;
}

// ---------------------------------------------------------------------------
// Input Format Detection
// ---------------------------------------------------------------------------

/** Formatos de entrada suportados pelo pipeline. */
export type InputFormat = 'csv' | 'nested_tables' | 'edited_tables' | 'raw_blocks' | 'unknown';

/** Resultado da detecção de formato de entrada. */
export interface DetectedInput {
  format: InputFormat;
  /** Dados já desempacotados (sem wrapper `data.data`). */
  payload: any;
}
