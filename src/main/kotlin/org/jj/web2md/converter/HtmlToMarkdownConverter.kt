package org.jj.web2md.converter

import com.vladsch.flexmark.html2md.converter.FlexmarkHtmlConverter
import org.jsoup.nodes.Document
import org.springframework.stereotype.Service

@Service
class HtmlToMarkdownConverter {

    private val flexmarkConverter: FlexmarkHtmlConverter = FlexmarkHtmlConverter.builder().build()

    companion object {
        private val REMOVABLE_TAGS = listOf(
            "script", "style", "nav", "footer", "header",
            "form", "iframe", "noscript", "svg", "button"
        )
        private val CONTENT_SELECTORS = listOf("main", "article", "[role=main]", "body")
        private val CONSECUTIVE_BLANK_LINES = Regex("\n{3,}")
        private val TRAILING_WHITESPACE = Regex("[ \t]+\n")
    }

    fun convert(document: Document): String {
        val cleaned = cleanHtml(document.clone())
        val contentHtml = extractContent(cleaned)
        val markdown = flexmarkConverter.convert(contentHtml)
        return postProcess(markdown)
    }

    private fun cleanHtml(document: Document): Document {
        REMOVABLE_TAGS.forEach { tag ->
            document.select(tag).remove()
        }
        document.select("[aria-hidden=true]").remove()
        document.select(".ad, .ads, .advertisement, .sidebar, .popup, .modal, .cookie-banner").remove()
        return document
    }

    private fun extractContent(document: Document): String {
        for (selector in CONTENT_SELECTORS) {
            val element = document.selectFirst(selector)
            if (element != null && element.hasText()) {
                return element.html()
            }
        }
        return document.body()?.html() ?: document.html()
    }

    private fun postProcess(markdown: String): String {
        return markdown
            .replace(TRAILING_WHITESPACE, "\n")
            .replace(CONSECUTIVE_BLANK_LINES, "\n\n")
            .trim()
    }
}
