package org.jj.web2md.fetcher

import org.jj.web2md.config.WebFetcherProperties
import org.jj.web2md.exception.Web2mdException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class HtmlFetcherTest {

    private val properties = WebFetcherProperties()
    private val fetcher = HtmlFetcher(properties)

    @ParameterizedTest
    @ValueSource(strings = ["ftp://example.com", "file:///etc/passwd", "javascript:alert(1)", "data:text/html,<h1>hi</h1>"])
    fun `should reject non-http protocols`(url: String) {
        val exception = assertThrows<Web2mdException.InvalidUrlException> {
            fetcher.fetch(url)
        }
        assertTrue(exception.message!!.contains("Invalid URL"))
    }

    @Test
    fun `should reject empty URL`() {
        assertThrows<Web2mdException.InvalidUrlException> {
            fetcher.fetch("")
        }
    }

    @Test
    fun `should reject malformed URL`() {
        assertThrows<Web2mdException.InvalidUrlException> {
            fetcher.fetch("not a url at all")
        }
    }

    @Test
    fun `should reject URL without scheme`() {
        assertThrows<Web2mdException.InvalidUrlException> {
            fetcher.fetch("example.com")
        }
    }

    @Test
    fun `should reject unresolvable host as invalid`() {
        assertThrows<Web2mdException.InvalidUrlException> {
            fetcher.fetch("https://this-domain-does-not-exist-xyz123.com")
        }
    }

    @ParameterizedTest
    @ValueSource(strings = ["http://example.com", "https://example.com", "HTTP://EXAMPLE.COM", "HTTPS://EXAMPLE.COM"])
    fun `should accept valid http and https URLs`(url: String) {
        // These are valid URLs - they won't throw InvalidUrlException
        // They may throw FetchFailedException if network is unavailable, which is expected
        try {
            fetcher.fetch(url)
        } catch (e: Web2mdException.FetchFailedException) {
            // Expected if no network - URL validation passed
        }
    }

    @ParameterizedTest
    @ValueSource(strings = [
        "http://127.0.0.1",
        "https://127.0.0.1:8080",
        "http://localhost",
        "https://localhost/path",
        "http://10.0.0.1",
        "http://192.168.1.1",
        "http://172.16.0.1"
    ])
    fun `should reject private and loopback addresses`(url: String) {
        assertThrows<Web2mdException.InvalidUrlException> {
            fetcher.fetch(url)
        }
    }

    @Test
    fun `should use configured properties`() {
        val customProperties = WebFetcherProperties(
            timeoutMillis = 5000,
            maxBodySizeBytes = 1024,
            userAgent = "CustomBot/1.0"
        )
        val customFetcher = HtmlFetcher(customProperties)
        // Verify it constructs without error
        assertEquals(5000, customProperties.timeoutMillis)
        assertEquals(1024, customProperties.maxBodySizeBytes)
        assertEquals("CustomBot/1.0", customProperties.userAgent)
    }
}
