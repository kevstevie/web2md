package org.jj.web2md.service

import org.jj.web2md.service.tokenizer.Tokenizer
import org.springframework.stereotype.Service
import kotlin.math.ln
import kotlin.math.sqrt

@Service
class TextRankSummarizer(private val tokenizer: Tokenizer) {

    companion object {
        private const val DAMPING = 0.85
        private const val ITERATIONS = 30
        private const val CONVERGENCE_THRESHOLD = 0.0001
    }

    /**
     * 문장 리스트를 받아 중요도 순으로 정렬된 인덱스를 반환합니다.
     * 인덱스 0이 가장 중요한 문장입니다.
     */
    fun rank(sentences: List<String>): List<Int> {
        if (sentences.size <= 2) return sentences.indices.toList()

        val tokenized = sentences.map { tokenizer.tokenize(it) }
        val tfidfVectors = buildTfIdf(tokenized)
        val simMatrix = buildSimilarityMatrix(tfidfVectors)
        val scores = textRank(simMatrix, sentences.size)

        return scores.indices.sortedByDescending { scores[it] }
    }

    // ---- TF-IDF ----

    private fun buildTfIdf(tokenized: List<List<String>>): List<Map<String, Double>> {
        val n = tokenized.size
        val df = mutableMapOf<String, Int>()
        tokenized.forEach { tokens ->
            tokens.toSet().forEach { df[it] = (df[it] ?: 0) + 1 }
        }

        return tokenized.map { tokens ->
            if (tokens.isEmpty()) return@map emptyMap()
            val tf = mutableMapOf<String, Double>()
            tokens.forEach { tf[it] = (tf[it] ?: 0.0) + 1.0 }
            tf.mapValues { (token, freq) ->
                (freq / tokens.size) * (ln((n + 1.0) / ((df[token] ?: 0) + 1.0)) + 1.0)
            }
        }
    }

    // ---- 코사인 유사도 ----

    private fun buildSimilarityMatrix(vectors: List<Map<String, Double>>): Array<DoubleArray> {
        val n = vectors.size
        val matrix = Array(n) { DoubleArray(n) }
        for (i in 0 until n) {
            for (j in i + 1 until n) {
                val sim = cosineSimilarity(vectors[i], vectors[j])
                matrix[i][j] = sim
                matrix[j][i] = sim
            }
        }
        return matrix
    }

    private fun cosineSimilarity(v1: Map<String, Double>, v2: Map<String, Double>): Double {
        if (v1.isEmpty() || v2.isEmpty()) return 0.0
        val dot = v1.entries.sumOf { (k, v) -> v * (v2[k] ?: 0.0) }
        val norm1 = sqrt(v1.values.sumOf { it * it })
        val norm2 = sqrt(v2.values.sumOf { it * it })
        return if (norm1 == 0.0 || norm2 == 0.0) 0.0 else dot / (norm1 * norm2)
    }

    // ---- TextRank (PageRank 방식) ----

    private fun textRank(simMatrix: Array<DoubleArray>, n: Int): DoubleArray {
        val rowSums = DoubleArray(n) { i -> simMatrix[i].sum() }
        var scores = DoubleArray(n) { 1.0 / n }

        repeat(ITERATIONS) {
            val next = DoubleArray(n)
            for (i in 0 until n) {
                var sum = 0.0
                for (j in 0 until n) {
                    if (rowSums[j] > 0) sum += (simMatrix[j][i] / rowSums[j]) * scores[j]
                }
                next[i] = (1 - DAMPING) / n + DAMPING * sum
            }
            val delta = next.indices.sumOf { i -> Math.abs(next[i] - scores[i]) }
            scores = next
            if (delta < CONVERGENCE_THRESHOLD) return scores
        }
        return scores
    }
}
