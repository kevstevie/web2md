package org.jj.web2md.service

import org.springframework.stereotype.Service

@Service
class MarkdownSummarizer(private val textRankSummarizer: TextRankSummarizer) {

    companion object {
        private const val DEFAULT_MAX_CHARS = 3000
        private const val TOP_PERCENT = 35
        private const val MIN_SUMMARY_SENTENCES = 3
        private const val MIN_SENTENCE_LENGTH = 15
        private val CODE_BLOCK = Regex("```[\\s\\S]*?```")
        private val INLINE_CODE = Regex("`[^`]+`")
        private val HEADING = Regex("^#{1,6}\\s+.+")
        private val LIST_ITEM = Regex("^\\s*[-*+]\\s+.+|^\\s*\\d+\\.\\s+.+")
        private val SENTENCE_BOUNDARY = Regex("(?<=[.!?。？！]\\s?)(?=\\S)")
    }

    fun summarize(markdown: String, maxChars: Int = DEFAULT_MAX_CHARS): String {
        val cleaned = CODE_BLOCK.replace(markdown, "")
        val sections = parseSections(cleaned.lines())

        // 전체 문서에서 산문 문장을 수집 (섹션 인덱스와 함께)
        val indexed = sections.flatMapIndexed { sIdx, section ->
            extractProseSentences(section.body).map { sIdx to it }
        }

        if (indexed.isEmpty()) return buildStructureOnly(sections, maxChars)

        // 전역 TextRank로 중요 문장 선별
        val topK = maxOf(MIN_SUMMARY_SENTENCES, indexed.size * TOP_PERCENT / 100)
        val importantTexts = textRankSummarizer.rank(indexed.map { it.second })
            .take(topK)
            .map { indexed[it].second }
            .toSet()

        // 중요 문장을 섹션별로 그룹핑 (원본 순서 유지)
        val importantBySect: Map<Int, List<String>> = indexed
            .filter { (_, text) -> text in importantTexts }
            .groupBy({ it.first }, { it.second })

        return buildSummary(sections, importantBySect, maxChars)
    }

    private fun parseSections(lines: List<String>): List<Section> {
        val sections = mutableListOf<Section>()
        var heading = ""
        var body = mutableListOf<String>()

        fun flush() {
            if (heading.isNotBlank() || body.any { it.isNotBlank() }) {
                sections += Section(heading, body.toList())
            }
            body = mutableListOf()
        }

        for (line in lines) {
            if (HEADING.matches(line)) {
                flush()
                heading = line
            } else {
                body += line
            }
        }
        flush()
        return sections
    }

    private fun extractProseSentences(body: List<String>): List<String> {
        val prose = body
            .filter { it.isNotBlank() && !LIST_ITEM.matches(it) }
            .joinToString(" ")
            .let { INLINE_CODE.replace(it, "") }
            .trim()
        return if (prose.isBlank()) emptyList()
        else splitSentences(prose)
    }

    private fun buildSummary(
        sections: List<Section>,
        importantBySect: Map<Int, List<String>>,
        maxChars: Int
    ): String {
        val result = StringBuilder()
        for ((sIdx, section) in sections.withIndex()) {
            val chunk = renderSection(section, importantBySect[sIdx] ?: emptyList())
            if (result.length + chunk.length > maxChars) break
            result.append(chunk)
        }
        return result.toString().trim()
    }

    // 헤딩과 리스트만 있고 산문이 없는 경우용
    private fun buildStructureOnly(sections: List<Section>, maxChars: Int): String {
        val result = StringBuilder()
        for (section in sections) {
            val chunk = renderSection(section, emptyList())
            if (result.length + chunk.length > maxChars) break
            result.append(chunk)
        }
        return result.toString().trim()
    }

    private fun renderSection(section: Section, importantSentences: List<String>): String {
        val sb = StringBuilder()
        if (section.heading.isNotBlank()) {
            sb.appendLine(section.heading)
            sb.appendLine()
        }
        if (importantSentences.isNotEmpty()) {
            sb.appendLine(importantSentences.joinToString(" "))
            sb.appendLine()
        }
        val listItems = section.body.filter { LIST_ITEM.matches(it) }
        if (listItems.isNotEmpty()) {
            listItems.forEach { sb.appendLine(it) }
            sb.appendLine()
        }
        return sb.toString()
    }

    private fun splitSentences(text: String): List<String> =
        SENTENCE_BOUNDARY.split(text)
            .map { it.trim() }
            .filter { it.length >= MIN_SENTENCE_LENGTH }

    data class Section(val heading: String, val body: List<String>)
}
