package org.jj.web2md.service

import org.jj.web2md.service.tokenizer.KoreanTokenizer
import org.jj.web2md.service.tokenizer.SimpleTokenizer
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class TextRankSummarizerTest {

    private val summarizer = TextRankSummarizer(SimpleTokenizer())

    @Test
    fun `should return all indices for two or fewer sentences`() {
        val sentences = listOf("First sentence here.", "Second sentence here.")
        val result = summarizer.rank(sentences)
        assertEquals(setOf(0, 1), result.toSet())
    }

    @Test
    fun `should return indices sorted by importance`() {
        // "authentication" 관련 문장이 반복 → 높은 TF-IDF → 높은 TextRank 점수
        val sentences = listOf(
            "Authentication uses JWT tokens for secure access.",   // 핵심 주제
            "JWT tokens must have an expiration time set.",        // 핵심 주제
            "Token-based authentication is the standard method.", // 핵심 주제
            "The weather is nice today outside.",                  // 무관한 문장
        )
        val ranked = summarizer.rank(sentences)

        // 인덱스 0,1,2 (인증 관련)가 인덱스 3 (날씨)보다 높은 순위여야 함
        val weatherIndex = ranked.indexOf(3)
        val authIndices = listOf(0, 1, 2).map { ranked.indexOf(it) }
        assertTrue(authIndices.all { it < weatherIndex })
    }

    @Test
    fun `should return correct number of indices`() {
        val sentences = List(10) { i -> "This is sentence number $i with some content words." }
        val result = summarizer.rank(sentences)
        assertEquals(10, result.size)
    }

    @Test
    fun `should handle single sentence`() {
        val result = summarizer.rank(listOf("Only one sentence here."))
        assertEquals(listOf(0), result)
    }

    @Test
    fun `should handle sentences with no common tokens`() {
        val sentences = listOf(
            "Apple banana cherry delta epsilon.",
            "Foxtrot golf hotel india juliet.",
            "Kilo lima mike november oscar."
        )
        val result = summarizer.rank(sentences)
        assertEquals(3, result.size)
        assertEquals(setOf(0, 1, 2), result.toSet())
    }

    @Test
    fun `should rank Korean sentences by topic relevance`() {
        val koreanSummarizer = TextRankSummarizer(KoreanTokenizer())
        val sentences = listOf(
            "인공지능은 현대 기술의 핵심 분야이다.",        // 핵심 주제
            "인공지능과 머신러닝은 데이터를 기반으로 학습한다.", // 핵심 주제
            "딥러닝 모델은 인공지능 발전을 이끌고 있다.",     // 핵심 주제
            "오늘 날씨가 맑고 화창하다."                  // 무관한 문장
        )

        val ranked = koreanSummarizer.rank(sentences)

        val weatherIndex = ranked.indexOf(3)
        val aiIndices = listOf(0, 1, 2).map { ranked.indexOf(it) }
        assertTrue(aiIndices.all { it < weatherIndex }, "인공지능 관련 문장이 날씨 문장보다 높은 순위여야 합니다")
    }
}
