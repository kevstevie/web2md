package org.jj.web2md.tool

import org.jj.web2md.converter.HtmlToMarkdownConverter
import org.jj.web2md.exception.Web2mdException
import org.jj.web2md.fetcher.JsHtmlFetcher
import org.jj.web2md.fetcher.StaticHtmlFetcher
import org.jj.web2md.service.MarkdownSummarizer
import org.jsoup.Jsoup
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.whenever
import kotlin.test.assertContains
import kotlin.test.assertTrue

@ExtendWith(MockitoExtension::class)
class WebToMarkdownToolTest {

    @Mock
    private lateinit var staticHtmlFetcher: StaticHtmlFetcher

    @Mock
    private lateinit var jsHtmlFetcher: JsHtmlFetcher

    @Mock
    private lateinit var htmlToMarkdownConverter: HtmlToMarkdownConverter

    @Mock
    private lateinit var markdownSummarizer: MarkdownSummarizer

    @InjectMocks
    private lateinit var tool: WebToMarkdownTool

    @Test
    fun `should return markdown with title using static fetcher by default`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>Example</title></head><body><p>Hello</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn("Hello")

        val result = tool.webToMarkdown(url)

        assertContains(result, "# Example")
        assertContains(result, "Hello")
    }

    @Test
    fun `should return markdown without title prefix when title is blank`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><body><p>Hello</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn("Hello")

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith("Hello"))
    }

    @Test
    fun `should use js fetcher when jsEnabled is true`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>SPA Page</title></head><body><p>Rendered</p></body></html>")
        whenever(jsHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn("Rendered")

        val result = tool.webToMarkdown(url, jsEnabled = true)

        assertContains(result, "# SPA Page")
        assertContains(result, "Rendered")
    }

    @Test
    fun `should return error string for invalid URL`() {
        val url = "ftp://invalid"
        whenever(staticHtmlFetcher.fetch(url)).thenThrow(Web2mdException.InvalidUrlException(url))

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith("Error:"))
        assertContains(result, "invalid")
    }

    @Test
    fun `should return error string for fetch failure`() {
        val url = "https://unreachable.example.com"
        whenever(staticHtmlFetcher.fetch(url)).thenThrow(
            Web2mdException.FetchFailedException(url, RuntimeException("Connection refused"))
        )

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith("Error:"))
        assertContains(result, "Failed to fetch")
    }

    @Test
    fun `should return error string for unexpected exception`() {
        val url = "https://example.com"
        whenever(staticHtmlFetcher.fetch(url)).thenThrow(RuntimeException("Something went wrong"))

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith("Error:"))
        assertContains(result, "unexpected error")
    }

    @Test
    fun `should return summarized content when summarize is true`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>Example</title></head><body><p>Content</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn("Content")
        whenever(markdownSummarizer.summarize("# Example\n\nContent")).thenReturn("요약된 내용")

        val result = tool.webToMarkdown(url, summarize = true)

        assertContains(result, "요약된 내용")
    }

    @Test
    fun `should return full markdown when summarize is false`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>Example</title></head><body><p>Full content here</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn("Full content here")

        val result = tool.webToMarkdown(url, summarize = false)

        assertContains(result, "# Example")
        assertContains(result, "Full content here")
    }
}
