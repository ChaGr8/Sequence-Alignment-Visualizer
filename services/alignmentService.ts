import { Scoring, AlignmentResult, TracebackCell, Move } from '../types';

const cleanSequence = (seq: string): string => {
    return seq.replace(/[^a-zA-Z]/g, '').toUpperCase();
};

const parseFasta = (fastaContent: string): string => {
    return fastaContent
        .split('\n')
        .filter(line => !line.startsWith('>'))
        .join('')
        .trim();
};

/**
 * Performs global sequence alignment using the Needleman-Wunsch algorithm.
 * This algorithm finds the optimal alignment that spans the entire length of both sequences,
 * making it suitable for comparing sequences that are expected to be similar across their whole length.
 * 
 * @param seq1 The first sequence string. Non-alphabetic characters will be ignored.
 * @param seq2 The second sequence string. Non-alphabetic characters will be ignored.
 * @param scoring Scoring parameters for match, mismatch, and gap penalties.
 * @returns An AlignmentResult object containing the aligned sequences, score, identity, DP matrix, and traceback path.
 */
const runNeedlemanWunsch = (seq1: string, seq2: string, scoring: Scoring): AlignmentResult => {
    const n = seq1.length;
    const m = seq2.length;
    
    // --- Step 1: Initialization ---
    // Create a DP (Dynamic Programming) matrix to store alignment scores and a trace matrix to store the path.
    // Initialize the first row and column with cumulative gap penalties, as any alignment starting
    // from an edge must begin with gaps.
    const matrix = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    const trace = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Move.STOP));

    for (let i = 1; i <= n; i++) {
        matrix[i][0] = i * scoring.gap;
        trace[i][0] = Move.UP;
    }
    for (let j = 1; j <= m; j++) {
        matrix[0][j] = j * scoring.gap;
        trace[0][j] = Move.LEFT;
    }

    // --- Step 2: Matrix Filling ---
    // Iterate through the matrix, calculating the score for each cell (i, j).
    // The score is the maximum of three possibilities:
    // 1. Diagonal: Aligning seq1[i-1] and seq2[j-1]. Score = matrix[i-1][j-1] + match/mismatch score.
    // 2. Up: Aligning seq1[i-1] with a gap. Score = matrix[i-1][j] + gap penalty.
    // 3. Left: Aligning seq2[j-1] with a gap. Score = matrix[i][j-1] + gap penalty.
    // The trace matrix stores which of these moves resulted in the maximum score.
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const matchScore = seq1[i - 1] === seq2[j - 1] ? scoring.match : scoring.mismatch;
            const diagonal = matrix[i - 1][j - 1] + matchScore;
            const up = matrix[i - 1][j] + scoring.gap;
            const left = matrix[i][j - 1] + scoring.gap;

            if (diagonal >= up && diagonal >= left) {
                matrix[i][j] = diagonal;
                trace[i][j] = Move.DIAGONAL;
            } else if (up >= left) {
                matrix[i][j] = up;
                trace[i][j] = Move.UP;
            } else {
                matrix[i][j] = left;
                trace[i][j] = Move.LEFT;
            }
        }
    }

    // --- Step 3: Traceback ---
    // Starting from the bottom-right corner, trace back to the top-left by following the path
    // in the trace matrix. This path reconstructs the optimal alignment by converting each move
    // (Diagonal, Up, Left) into an alignment character (match/mismatch or gap).
    let alignedSeq1 = '';
    let alignedSeq2 = '';
    let i = n;
    let j = m;
    const path: TracebackCell[] = [];
    
    while (i > 0 || j > 0) {
        path.push({ row: i, col: j });
        const move = trace[i][j];
        if (move === Move.DIAGONAL) {
            alignedSeq1 = seq1[i - 1] + alignedSeq1;
            alignedSeq2 = seq2[j - 1] + alignedSeq2;
            i--;
            j--;
        } else if (move === Move.UP) {
            alignedSeq1 = seq1[i - 1] + alignedSeq1;
            alignedSeq2 = '-' + alignedSeq2;
            i--;
        } else { // Move.LEFT
            alignedSeq1 = '-' + alignedSeq1;
            alignedSeq2 = seq2[j - 1] + alignedSeq2;
            j--;
        }
    }
    path.push({ row: 0, col: 0 });

    const score = matrix[n][m];
    const identity = calculateIdentity(alignedSeq1, alignedSeq2);

    // FIX: Include scoring parameters in the result object.
    return { alignedSeq1, alignedSeq2, identity, score, matrix, trace, path: path.reverse(), seq1, seq2, scoring };
};

/**
 * Performs local sequence alignment using the Smith-Waterman algorithm.
 * This algorithm finds the best-matching sub-regions between two sequences, making it ideal
 * for finding conserved domains or motifs, even in dissimilar sequences.
 * 
 * @param seq1 The first sequence string. Non-alphabetic characters will be ignored.
 * @param seq2 The second sequence string. Non-alphabetic characters will be ignored.
 * @param scoring Scoring parameters for match, mismatch, and gap penalties.
 * @returns An AlignmentResult object for the best local alignment.
 */
const runSmithWaterman = (seq1: string, seq2: string, scoring: Scoring): AlignmentResult => {
    const n = seq1.length;
    const m = seq2.length;
    
    // --- Step 1: Initialization ---
    // Create DP and trace matrices. Unlike Needleman-Wunsch, the first row and column are 0,
    // as local alignments can start anywhere. We also track the cell with the highest score.
    const matrix = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    const trace = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Move.STOP));
    let maxScore = 0;
    let maxI = 0;
    let maxJ = 0;

    // --- Step 2: Matrix Filling ---
    // The score calculation is similar to Needleman-Wunsch, but with a crucial difference:
    // the score for any cell cannot be negative. If all three possible moves result in a negative
    // score, the cell's value is set to 0, signifying the start of a new potential local alignment.
    // We keep track of the highest score found anywhere in the matrix.
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            const matchScore = seq1[i - 1] === seq2[j - 1] ? scoring.match : scoring.mismatch;
            const diagonal = matrix[i - 1][j - 1] + matchScore;
            const up = matrix[i - 1][j] + scoring.gap;
            const left = matrix[i][j - 1] + scoring.gap;
            const score = Math.max(0, diagonal, up, left);
            matrix[i][j] = score;

            if (score > maxScore) {
                maxScore = score;
                maxI = i;
                maxJ = j;
            }

            if (score === 0) {
                trace[i][j] = Move.STOP;
            } else if (score === diagonal) {
                trace[i][j] = Move.DIAGONAL;
            } else if (score === up) {
                trace[i][j] = Move.UP;
            } else { // score === left
                trace[i][j] = Move.LEFT;
            }
        }
    }

    // --- Step 3: Traceback ---
    // Traceback starts from the cell with the highest score found during the filling step.
    // The process follows the trace matrix backwards until a cell with a score of 0 is reached,
    // which marks the beginning of the optimal local alignment.
    let alignedSeq1 = '';
    let alignedSeq2 = '';
    let i = maxI;
    let j = maxJ;
    const path: TracebackCell[] = [];

    while (matrix[i][j] > 0) {
        path.push({ row: i, col: j });
        const move = trace[i][j];
        if (move === Move.DIAGONAL) {
            alignedSeq1 = seq1[i - 1] + alignedSeq1;
            alignedSeq2 = seq2[j - 1] + alignedSeq2;
            i--;
            j--;
        } else if (move === Move.UP) {
            alignedSeq1 = seq1[i - 1] + alignedSeq1;
            alignedSeq2 = '-' + alignedSeq2;
            i--;
        } else { // Move.LEFT
            alignedSeq1 = '-' + alignedSeq1;
            alignedSeq2 = seq2[j - 1] + alignedSeq2;
            j--;
        }
    }
    path.push({ row: i, col: j });
    
    const identity = calculateIdentity(alignedSeq1, alignedSeq2);
    
    // FIX: Include scoring parameters in the result object.
    return { alignedSeq1, alignedSeq2, identity, score: maxScore, matrix, trace, path: path.reverse(), seq1, seq2, scoring };
};

/**
 * Calculates the identity percentage of an alignment.
 * Identity is the number of matching characters divided by the total alignment length.
 * @param s1 Aligned sequence 1.
 * @param s2 Aligned sequence 2.
 * @returns The identity percentage.
 */
const calculateIdentity = (s1: string, s2: string): number => {
    if (s1.length === 0) return 0;
    let matches = 0;
    for (let i = 0; i < s1.length; i++) {
        if (s1[i] === s2[i] && s1[i] !== '-') {
            matches++;
        }
    }
    const alignmentLength = s1.length;
    return (matches / alignmentLength) * 100;
};

export const alignmentService = {
    runNeedlemanWunsch,
    runSmithWaterman,
    cleanSequence,
    parseFasta,
};