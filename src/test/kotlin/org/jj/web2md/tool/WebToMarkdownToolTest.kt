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
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import kotlin.test.assertContains
import kotlin.test.assertTrue

@ExtendWith(MockitoExtension::class)
class WebToMarkdownToolTest {

    companion object {
        private const val LONG_CONTENT = "This is a sufficiently long content that exceeds the minimum content length threshold. " +
            "It contains enough text to avoid triggering the Googlebot fallback mechanism. " +
            "The content needs to be at least 200 characters long to be considered valid."
        private const val GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    }

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
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn(LONG_CONTENT)

        val result = tool.webToMarkdown(url)

        assertContains(result, "# Example")
        assertContains(result, LONG_CONTENT)
    }

    @Test
    fun `should return markdown without title prefix when title is blank`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><body><p>Hello</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn(LONG_CONTENT)

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith(LONG_CONTENT))
    }

    @Test
    fun `should use js fetcher when jsEnabled is true`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>SPA Page</title></head><body><p>Rendered</p></body></html>")
        whenever(jsHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn(LONG_CONTENT)

        val result = tool.webToMarkdown(url, jsEnabled = true)

        assertContains(result, "# SPA Page")
        assertContains(result, LONG_CONTENT)
    }

    @Test
    fun `should fallback to Googlebot UA when content is too short`() {
        val url = "https://example.com"
        val emptyDoc = Jsoup.parse("<html><head><title>SPA</title></head><body><div id='root'></div></body></html>")
        val richDoc = Jsoup.parse("<html><head><title>SPA</title></head><body><p>Rich content</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(emptyDoc)
        whenever(htmlToMarkdownConverter.convert(emptyDoc)).thenReturn("") // 빈 결과
        whenever(staticHtmlFetcher.fetchWithUserAgent(url, GOOGLEBOT_UA)).thenReturn(richDoc)
        whenever(htmlToMarkdownConverter.convert(richDoc)).thenReturn(LONG_CONTENT)

        val result = tool.webToMarkdown(url)

        assertContains(result, LONG_CONTENT)
        verify(staticHtmlFetcher).fetchWithUserAgent(url, GOOGLEBOT_UA)
    }

    @Test
    fun `should not fallback to Googlebot UA when content is sufficient`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>Example</title></head><body><p>Content</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn(LONG_CONTENT)

        tool.webToMarkdown(url)

        verify(staticHtmlFetcher, never()).fetchWithUserAgent(any(), any())
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
    fun `should return summarized content when summaryLevel is provided`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>Example</title></head><body><p>Content</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn(LONG_CONTENT)
        whenever(markdownSummarizer.summarize("# Example\n\n$LONG_CONTENT", 3)).thenReturn("요약된 내용")

        val result = tool.webToMarkdown(url, summaryLevel = 3)

        assertContains(result, "요약된 내용")
    }

    @Test
    fun `should return full markdown when summaryLevel is null`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>Example</title></head><body><p>Full content here</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn(LONG_CONTENT)

        val result = tool.webToMarkdown(url, summaryLevel = null)

        assertContains(result, "# Example")
        assertContains(result, LONG_CONTENT)
    }

    @Test
    fun `should pass summaryLevel to summarizer`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>Test</title></head><body><p>Brief</p></body></html>")
        whenever(staticHtmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn(LONG_CONTENT)
        whenever(markdownSummarizer.summarize("# Test\n\n$LONG_CONTENT", 1)).thenReturn("매우 간결한 요약")

        val result = tool.webToMarkdown(url, summaryLevel = 1)

        assertContains(result, "매우 간결한 요약")
    }
}
