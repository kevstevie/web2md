package org.jj.web2md.config

import org.jj.web2md.service.tokenizer.KoreanTokenizer
import org.jj.web2md.service.tokenizer.SimpleTokenizer
import org.jj.web2md.service.tokenizer.Tokenizer
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class TokenizerConfig {

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
        return korean.toDouble() / letters > 0.2
    }
}
