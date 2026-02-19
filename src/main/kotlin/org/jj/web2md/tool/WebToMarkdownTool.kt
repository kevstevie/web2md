package org.jj.web2md.tool

import org.jj.web2md.converter.HtmlToMarkdownConverter
import org.jj.web2md.exception.Web2mdException
import org.jj.web2md.fetcher.JsHtmlFetcher
import org.jj.web2md.fetcher.StaticHtmlFetcher
import org.jj.web2md.service.MarkdownSummarizer
import org.slf4j.LoggerFactory
import org.springframework.ai.tool.annotation.Tool
import org.springframework.ai.tool.annotation.ToolParam
import org.springframework.stereotype.Service

@Service
class WebToMarkdownTool(
    private val staticHtmlFetcher: StaticHtmlFetcher,
    private val jsHtmlFetcher: JsHtmlFetcher,
    private val htmlToMarkdownConverter: HtmlToMarkdownConverter,
    private val markdownSummarizer: MarkdownSummarizer
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    companion object {
        private const val GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        private const val MIN_CONTENT_LENGTH = 200
    }

    @Tool(description = "Fetches a web page from the given URL and converts it to Markdown. For full content, omit summaryLevel. For an extractive summary, set summaryLevel to an integer 1-5 (1=most concise, 5=most detailed). Do not pass null as a value.")
    fun webToMarkdown(
        @ToolParam(description = "The URL of the web page to fetch") url: String,
        @ToolParam(description = "Set to true for JavaScript-rendered SPA pages (React, Vue, Angular, etc.). Default is false.") jsEnabled: Boolean = false,
        @ToolParam(description = "Integer 1-5 for extractive summary. 1=most concise, 5=most detailed. Omit this parameter entirely for full content.") summaryLevel: Int? = null
    ): String {
        return try {
            val fetcher = if (jsEnabled) jsHtmlFetcher else staticHtmlFetcher
            val document = fetcher.fetch(url)
            val markdown = htmlToMarkdownConverter.convert(document)

            logger.info("[web2md] html title='{}' markdown.length={}", document.title(), markdown.length)

            val fullMarkdown = if (markdown.length < MIN_CONTENT_LENGTH) {
                logger.info("[web2md] Content too short, retrying with Googlebot UA")
                fetchWithGooglebotFallback(url, document.title())
            } else {
                val title = document.title()
                if (title.isNotBlank()) "# $title\n\n$markdown" else markdown
            }

            if (summaryLevel != null) markdownSummarizer.summarize(fullMarkdown, summaryLevel) else fullMarkdown
        } catch (e: Web2mdException.InvalidUrlException) {
            logger.warn("Invalid URL provided: {}", url)
            "Error: The provided URL is invalid. Only http and https URLs pointing to public hosts are supported."
        } catch (e: Web2mdException.FetchFailedException) {
            logger.warn("Failed to fetch URL: {}", url, e)
            "Error: Failed to fetch the web page. Please check if the URL is accessible."
        } catch (e: Exception) {
            logger.error("Unexpected error processing URL: {}", url, e)
            "Error: An unexpected error occurred while processing the request."
        }
    }

    private fun fetchWithGooglebotFallback(url: String, originalTitle: String): String {
        return try {
            val document = staticHtmlFetcher.fetchWithUserAgent(url, GOOGLEBOT_UA)
            val markdown = htmlToMarkdownConverter.convert(document)
            val title = document.title().ifBlank { originalTitle }
            if (title.isNotBlank()) "# $title\n\n$markdown" else markdown
        } catch (e: Exception) {
            logger.debug("Googlebot UA fallback failed for: {}", url, e)
            if (originalTitle.isNotBlank()) "# $originalTitle\n\n" else ""
        }
    }
}
