package org.jj.web2md.tool

import org.jj.web2md.converter.HtmlToMarkdownConverter
import org.jj.web2md.exception.Web2mdException
import org.jj.web2md.fetcher.HtmlFetcher
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
    private lateinit var htmlFetcher: HtmlFetcher

    @Mock
    private lateinit var htmlToMarkdownConverter: HtmlToMarkdownConverter

    @InjectMocks
    private lateinit var tool: WebToMarkdownTool

    @Test
    fun `should return markdown with title`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><head><title>Example</title></head><body><p>Hello</p></body></html>")
        whenever(htmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn("Hello")

        val result = tool.webToMarkdown(url)

        assertContains(result, "# Example")
        assertContains(result, "Hello")
    }

    @Test
    fun `should return markdown without title prefix when title is blank`() {
        val url = "https://example.com"
        val doc = Jsoup.parse("<html><body><p>Hello</p></body></html>")
        whenever(htmlFetcher.fetch(url)).thenReturn(doc)
        whenever(htmlToMarkdownConverter.convert(doc)).thenReturn("Hello")

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith("Hello"))
    }

    @Test
    fun `should return error string for invalid URL`() {
        val url = "ftp://invalid"
        whenever(htmlFetcher.fetch(url)).thenThrow(Web2mdException.InvalidUrlException(url))

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith("Error:"))
        assertContains(result, "invalid")
    }

    @Test
    fun `should return error string for fetch failure`() {
        val url = "https://unreachable.example.com"
        whenever(htmlFetcher.fetch(url)).thenThrow(
            Web2mdException.FetchFailedException(url, RuntimeException("Connection refused"))
        )

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith("Error:"))
        assertContains(result, "Failed to fetch")
    }

    @Test
    fun `should return error string for unexpected exception`() {
        val url = "https://example.com"
        whenever(htmlFetcher.fetch(url)).thenThrow(RuntimeException("Something went wrong"))

        val result = tool.webToMarkdown(url)

        assertTrue(result.startsWith("Error:"))
        assertContains(result, "unexpected error")
    }
}
