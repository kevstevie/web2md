package org.jj.web2md.tool

import org.jj.web2md.converter.HtmlToMarkdownConverter
import org.jj.web2md.exception.Web2mdException
import org.jj.web2md.fetcher.HtmlFetcher
import org.slf4j.LoggerFactory
import org.springframework.ai.tool.annotation.Tool
import org.springframework.ai.tool.annotation.ToolParam
import org.springframework.stereotype.Service

@Service
class WebToMarkdownTool(
    private val htmlFetcher: HtmlFetcher,
    private val htmlToMarkdownConverter: HtmlToMarkdownConverter
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    @Tool(description = "Fetches a web page from the given URL and converts it to clean Markdown format. Supports only http/https URLs. Does not support JavaScript-rendered (SPA) pages.")
    fun webToMarkdown(@ToolParam(description = "The URL of the web page to convert to Markdown") url: String): String {
        return try {
            val document = htmlFetcher.fetch(url)
            val title = document.title()
            val markdown = htmlToMarkdownConverter.convert(document)

            if (title.isNotBlank()) {
                "# $title\n\n$markdown"
            } else {
                markdown
            }
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
