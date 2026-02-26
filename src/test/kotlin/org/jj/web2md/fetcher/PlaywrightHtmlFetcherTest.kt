package org.jj.web2md.fetcher

import com.microsoft.playwright.Page
import org.jj.web2md.exception.Web2mdException
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.mockito.Mock
import org.mockito.Mockito.doAnswer
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness
import kotlin.test.assertContains
import kotlin.test.assertTrue

@ExtendWith(MockitoExtension::class)
@MockitoSettings(strictness = Strictness.LENIENT)
class PlaywrightHtmlFetcherTest {

    @Mock
    private lateinit var manager: PlaywrightManager

    @Mock
    private lateinit var page: Page

    private lateinit var fetcher: PlaywrightHtmlFetcher

    @BeforeEach
    fun setUp() {
        fetcher = PlaywrightHtmlFetcher(manager)
        // PlaywrightManager.withPage { block } 호출 시 mock page를 전달하도록 설정
        doAnswer { invocation ->
            val block = invocation.getArgument<(Page) -> Any>(0)
            block(page)
        }.whenever(manager).withPage(any<(Page) -> Any>())
    }

    @Test
    fun `should return parsed document from playwright page content`() {
        val url = "https://example.com"
        val html = "<html><head><title>Test</title></head><body><p>Hello Playwright</p></body></html>"
        whenever(page.content()).thenReturn(html)

        val doc = fetcher.fetch(url)

        assertContains(doc.title(), "Test")
        assertTrue(doc.select("p").text().contains("Hello Playwright"))
    }

    @Test
    fun `should wrap unexpected exception in FetchFailedException`() {
        val url = "https://example.com"
        whenever(page.content()).thenThrow(RuntimeException("Navigation failed"))

        assertThrows<Web2mdException.FetchFailedException> {
            fetcher.fetch(url)
        }
    }

    @Test
    fun `should propagate FetchFailedException as-is`() {
        val url = "https://example.com"
        whenever(page.content()).thenThrow(Web2mdException.FetchFailedException(url, RuntimeException()))

        assertThrows<Web2mdException.FetchFailedException> {
            fetcher.fetch(url)
        }
    }

    @ParameterizedTest
    @ValueSource(strings = ["ftp://example.com", "file:///etc/passwd", "", "not a url"])
    fun `should reject invalid URLs before fetching`(url: String) {
        assertThrows<Web2mdException.InvalidUrlException> {
            fetcher.fetch(url)
        }
    }

    @ParameterizedTest
    @ValueSource(strings = [
        "http://127.0.0.1",
        "https://localhost",
        "http://192.168.1.1",
        "http://10.0.0.1"
    ])
    fun `should reject private addresses`(url: String) {
        assertThrows<Web2mdException.InvalidUrlException> {
            fetcher.fetch(url)
        }
    }
}
