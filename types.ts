export enum Algorithm {
  NeedlemanWunsch = "Needleman-Wunsch (Global)",
  SmithWaterman = "Smith-Waterman (Local)",
  MultipleSequenceAlignment = "Multiple Sequence Alignment (Coming Soon)",
}

export enum SequenceType {
  DNA = "DNA",
  RNA = "RNA",
  Protein = "Protein",
}

export enum Move {
  DIAGONAL,
  UP,
  LEFT,
  STOP,
}

export interface Scoring {
  match: number;
  mismatch: number;
  gap: number;
}

export interface AlignmentResult {
  alignedSeq1: string;
  alignedSeq2: string;
  identity: number;
  score: number;
  matrix: number[][];
  trace: Move[][];
  path: { row: number; col: number }[];
  seq1: string;
  seq2: string;
  // FIX: Add scoring to the result type to make it available for visualization.
  scoring: Scoring;
}

export interface TracebackCell {
  row: number;
  col: number;
}