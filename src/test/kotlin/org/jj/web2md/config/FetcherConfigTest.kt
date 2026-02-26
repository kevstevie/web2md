package org.jj.web2md.config

import org.jj.web2md.fetcher.PlaywrightManager
import org.jj.web2md.fetcher.StaticHtmlFetcher
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import kotlin.test.assertIs

@ExtendWith(MockitoExtension::class)
class FetcherConfigTest {

    @Mock
    private lateinit var staticHtmlFetcher: StaticHtmlFetcher

    @Mock
    private lateinit var playwrightManager: PlaywrightManager

    @Test
    fun `engine=jsoup should always use StaticHtmlFetcher without initializing Playwright`() {
        val config = FetcherConfig(staticHtmlFetcher, playwrightManager, WebFetcherProperties(engine = "jsoup"))

        val fetcher = config.htmlFetcher()

        assertIs<StaticHtmlFetcher>(fetcher)
        verify(playwrightManager, never()).initialize()
    }

    @Test
    fun `engine=auto should use StaticHtmlFetcher when Playwright is not available`() {
        whenever(playwrightManager.initialize()).thenReturn(false)
        val config = FetcherConfig(staticHtmlFetcher, playwrightManager, WebFetcherProperties(engine = "auto"))

        val fetcher = config.htmlFetcher()

        assertIs<StaticHtmlFetcher>(fetcher)
    }

    @Test
    fun `engine=playwright should use StaticHtmlFetcher as fallback when Playwright unavailable`() {
        whenever(playwrightManager.initialize()).thenReturn(false)
        val config = FetcherConfig(staticHtmlFetcher, playwrightManager, WebFetcherProperties(engine = "playwright"))

        val fetcher = config.htmlFetcher()

        assertIs<StaticHtmlFetcher>(fetcher)
    }

    @Test
    fun `engine=auto should use PlaywrightHtmlFetcher when Playwright is available`() {
        whenever(playwrightManager.initialize()).thenReturn(true)
        val config = FetcherConfig(staticHtmlFetcher, playwrightManager, WebFetcherProperties(engine = "auto"))

        val fetcher = config.htmlFetcher()

        assertIs<org.jj.web2md.fetcher.PlaywrightHtmlFetcher>(fetcher)
    }

    @Test
    fun `unknown engine value should fall back to auto behavior`() {
        whenever(playwrightManager.initialize()).thenReturn(false)
        val config = FetcherConfig(staticHtmlFetcher, playwrightManager, WebFetcherProperties(engine = "unknown"))

        val fetcher = config.htmlFetcher()

        assertIs<StaticHtmlFetcher>(fetcher)
    }
}
