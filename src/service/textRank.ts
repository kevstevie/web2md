import type { Tokenizer } from './tokenizer/types.js';

const DAMPING = 0.85;
const ITERATIONS = 30;
const CONVERGENCE_THRESHOLD = 0.0001;

/**
 * Returns sentence indices sorted by importance (index 0 = most important).
 */
export function rankSentences(sentences: string[], tokenizer: Tokenizer): number[] {
  if (sentences.length <= 2) {
    return sentences.map((_, i) => i);
  }

  const tokenized = sentences.map(s => tokenizer.tokenize(s));
  const tfidfVectors = buildTfIdf(tokenized);
  const simMatrix = buildSimilarityMatrix(tfidfVectors);
  const scores = textRank(simMatrix, sentences.length);

  return scores
    .map((score, idx) => ({ score, idx }))
    .sort((a, b) => b.score - a.score)
    .map(({ idx }) => idx);
}

function buildTfIdf(tokenized: string[][]): Map<string, number>[] {
  const n = tokenized.length;
  const df = new Map<string, number>();

  for (const tokens of tokenized) {
    for (const token of new Set(tokens)) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }

  return tokenized.map(tokens => {
    if (tokens.length === 0) return new Map<string, number>();

    const tf = new Map<string, number>();
    for (const token of tokens) {
      tf.set(token, (tf.get(token) ?? 0) + 1);
    }

    const result = new Map<string, number>();
    for (const [token, freq] of tf) {
      const tfScore = freq / tokens.length;
      const idf = Math.log((n + 1) / ((df.get(token) ?? 0) + 1)) + 1;
      result.set(token, tfScore * idf);
    }
    return result;
  });
}

function cosineSimilarity(v1: Map<string, number>, v2: Map<string, number>): number {
  if (v1.size === 0 || v2.size === 0) return 0;

  let dot = 0;
  for (const [token, val] of v1) {
    dot += val * (v2.get(token) ?? 0);
  }

  let norm1 = 0;
  for (const val of v1.values()) norm1 += val * val;
  let norm2 = 0;
  for (const val of v2.values()) norm2 += val * val;

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  return norm1 === 0 || norm2 === 0 ? 0 : dot / (norm1 * norm2);
}

function buildSimilarityMatrix(vectors: Map<string, number>[]): number[][] {
  const n = vectors.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      matrix[i][j] = sim;
      matrix[j][i] = sim;
    }
  }

  return matrix;
}

function textRank(simMatrix: number[][], n: number): number[] {
  const rowSums = simMatrix.map(row => row.reduce((a, b) => a + b, 0));
  let scores = new Array(n).fill(1.0 / n);

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const next = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (rowSums[j] > 0) {
          sum += (simMatrix[j][i] / rowSums[j]) * scores[j];
        }
      }
      next[i] = (1 - DAMPING) / n + DAMPING * sum;
    }

    const delta = next.reduce((acc, val, i) => acc + Math.abs(val - scores[i]), 0);
    scores = next;
    if (delta < CONVERGENCE_THRESHOLD) break;
  }

  return scores;
}
