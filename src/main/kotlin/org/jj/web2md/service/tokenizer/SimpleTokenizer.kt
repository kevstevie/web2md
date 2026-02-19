package org.jj.web2md.service.tokenizer

class SimpleTokenizer : Tokenizer {

    private val wordPattern = Regex("[a-zA-Z]{3,}")
    private val stopWords = setOf(
        "the", "and", "for", "are", "but", "not", "you", "all", "can",
        "had", "her", "was", "one", "our", "out", "day", "get", "has",
        "him", "his", "how", "its", "may", "new", "now", "old", "see",
        "two", "who", "boy", "did", "own", "say", "she", "too", "use",
        "that", "this", "with", "have", "from", "they", "will", "been",
        "were", "when", "what", "your", "each", "more", "also", "into",
        "than", "then", "some", "time", "very", "just", "know", "take",
        "people", "because", "about", "which", "there", "their", "would",
        "could", "should", "other", "after", "think", "these", "those"
    )

    override fun tokenize(text: String): List<String> =
        wordPattern.findAll(text.lowercase())
            .map { it.value }
            .filter { it !in stopWords }
            .toList()
}
