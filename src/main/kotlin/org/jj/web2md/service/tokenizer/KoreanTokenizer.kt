package org.jj.web2md.service.tokenizer

import kr.co.shineware.nlp.komoran.constant.DEFAULT_MODEL
import kr.co.shineware.nlp.komoran.core.Komoran

class KoreanTokenizer : Tokenizer {

    private val komoran = Komoran(DEFAULT_MODEL.LIGHT)

    // 요약에 의미있는 품사: 일반명사, 고유명사, 동사, 형용사, 일반부사
    private val contentPosTags = setOf("NNG", "NNP", "VV", "VA", "MAG")

    override fun tokenize(text: String): List<String> =
        komoran.analyze(text).tokenList
            .filter { it.pos in contentPosTags }
            .map { it.morph }
            .filter { it.length >= 2 }
}
