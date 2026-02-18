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

    @Tool(description = "Fetches a web page from the given URL and converts it to Markdown. Use summarize=true when only an overview is needed (cost-efficient). Use summarize=false (default) when full content is required.")
    fun webToMarkdown(
        @ToolParam(description = "The URL of the web page to fetch") url: String,
        @ToolParam(description = "Set to true for JavaScript-rendered SPA pages (React, Vue, Angular, etc.). Default is false.") jsEnabled: Boolean = false,
        @ToolParam(description = "Set to true to return an extractive summary instead of full Markdown. Reduces context size. Default is false.") summarize: Boolean = false
    ): String {
        return try {
            val fetcher = if (jsEnabled) jsHtmlFetcher else staticHtmlFetcher
            val document = fetcher.fetch(url)
            val title = document.title()
            val markdown = htmlToMarkdownConverter.convert(document)
            val fullMarkdown = if (title.isNotBlank()) "# $title\n\n$markdown" else markdown

            if (summarize) markdownSummarizer.summarize(fullMarkdown) else fullMarkdown
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
}
