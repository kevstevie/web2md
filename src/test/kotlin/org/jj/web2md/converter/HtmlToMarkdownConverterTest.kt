package org.jj.web2md.converter

import org.jsoup.Jsoup
import org.junit.jupiter.api.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFalse

class HtmlToMarkdownConverterTest {

    private val converter = HtmlToMarkdownConverter()

    @Test
    fun `should convert simple HTML to markdown`() {
        val html = "<html><body><h1>Title</h1><p>Hello <strong>world</strong></p></body></html>"
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "Title")
        assertContains(result, "**world**")
    }

    @Test
    fun `should remove script tags`() {
        val html = "<html><body><p>Content</p><script>alert('xss')</script></body></html>"
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertFalse(result.contains("alert"))
        assertContains(result, "Content")
    }

    @Test
    fun `should remove style tags`() {
        val html = "<html><body><style>.foo{color:red}</style><p>Content</p></body></html>"
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertFalse(result.contains("color"))
        assertContains(result, "Content")
    }

    @Test
    fun `should remove nav footer header form iframe`() {
        val html = """
            <html><body>
                <nav><a href="/">Home</a></nav>
                <header><h1>Site Header</h1></header>
                <main><p>Main content</p></main>
                <footer><p>Footer</p></footer>
                <form><input type="text"></form>
                <iframe src="https://example.com"></iframe>
            </body></html>
        """.trimIndent()
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "Main content")
        assertFalse(result.contains("Home"))
        assertFalse(result.contains("Site Header"))
        assertFalse(result.contains("Footer"))
    }

    @Test
    fun `should prefer main element for content extraction`() {
        val html = """
            <html><body>
                <div><p>Outside content</p></div>
                <main><p>Main content</p></main>
            </body></html>
        """.trimIndent()
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "Main content")
        assertFalse(result.contains("Outside content"))
    }

    @Test
    fun `should prefer article when no main element`() {
        val html = """
            <html><body>
                <div><p>Outside content</p></div>
                <article><p>Article content</p></article>
            </body></html>
        """.trimIndent()
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "Article content")
        assertFalse(result.contains("Outside content"))
    }

    @Test
    fun `should fallback to body when no main or article`() {
        val html = "<html><body><p>Body content</p></body></html>"
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "Body content")
    }

    @Test
    fun `should convert links to markdown`() {
        val html = """<html><body><a href="https://example.com">Example</a></body></html>"""
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "[Example](https://example.com)")
    }

    @Test
    fun `should convert lists to markdown`() {
        val html = """
            <html><body>
                <ul>
                    <li>Item 1</li>
                    <li>Item 2</li>
                </ul>
            </body></html>
        """.trimIndent()
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "Item 1")
        assertContains(result, "Item 2")
    }

    @Test
    fun `should collapse consecutive blank lines`() {
        val html = "<html><body><p>First</p><br><br><br><br><p>Second</p></body></html>"
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertFalse(result.contains("\n\n\n"))
    }

    @Test
    fun `should not mutate original document`() {
        val html = "<html><body><script>var x = 1;</script><p>Content</p></body></html>"
        val doc = Jsoup.parse(html)
        val originalScriptCount = doc.select("script").size

        converter.convert(doc)

        assertEquals(originalScriptCount, doc.select("script").size)
    }

    @Test
    fun `should remove ad-related elements`() {
        val html = """
            <html><body>
                <div class="ad">Ad content</div>
                <div class="sidebar">Sidebar</div>
                <p>Real content</p>
            </body></html>
        """.trimIndent()
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "Real content")
        assertFalse(result.contains("Ad content"))
    }

    @Test
    fun `should handle role=main attribute`() {
        val html = """
            <html><body>
                <div><p>Outside</p></div>
                <div role="main"><p>Main role content</p></div>
            </body></html>
        """.trimIndent()
        val doc = Jsoup.parse(html)

        val result = converter.convert(doc)

        assertContains(result, "Main role content")
        assertFalse(result.contains("Outside"))
    }
}
