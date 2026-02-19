package org.jj.web2md.service.tokenizer

fun interface Tokenizer {
    fun tokenize(text: String): List<String>
}
