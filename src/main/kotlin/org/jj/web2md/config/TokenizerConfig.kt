package org.jj.web2md.config

import org.jj.web2md.service.tokenizer.KoreanTokenizer
import org.jj.web2md.service.tokenizer.SimpleTokenizer
import org.jj.web2md.service.tokenizer.Tokenizer
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class TokenizerConfig {

    companion object {
        // 문자 중 40% 이상이 한글일 때 한국어 문서로 판정
        // 영어 문서에 일부 한글이 섞인 경우를 걸러내기 위해 0.4 사용
        private const val KOREAN_DOMINANCE_THRESHOLD = 0.4
    }

    private val logger = LoggerFactory.getLogger(javaClass)

    @Bean
    fun tokenizer(): Tokenizer {
        val korean = try {
            KoreanTokenizer().also { logger.info("Komoran Korean tokenizer initialized.") }
        } catch (e: Exception) {
            logger.warn("Komoran initialization failed, Korean morpheme analysis unavailable: {}", e.message)
            null
        }
        val simple = SimpleTokenizer()

        return Tokenizer { text ->
            if (korean != null && isKoreanDominant(text)) korean.tokenize(text)
            else simple.tokenize(text)
        }
    }

    private fun isKoreanDominant(text: String): Boolean {
        val letters = text.count { it.isLetter() }
        if (letters == 0) return false
        val korean = text.count { it in '가'..'힣' }
        return korean.toDouble() / letters > KOREAN_DOMINANCE_THRESHOLD
    }
}
