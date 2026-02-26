package org.jj.web2md.fetcher

import com.microsoft.playwright.Browser
import com.microsoft.playwright.BrowserType
import com.microsoft.playwright.Page
import com.microsoft.playwright.Playwright
import jakarta.annotation.PreDestroy
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component

@Component
class PlaywrightManager {

    private val logger = LoggerFactory.getLogger(javaClass)

    private var playwright: Playwright? = null
    private var browser: Browser? = null

    fun initialize(): Boolean {
        return try {
            playwright = Playwright.create()
            browser = playwright!!.chromium().launch(
                BrowserType.LaunchOptions().setHeadless(true)
            )
            true
        } catch (e: Exception) {
            logger.debug("Playwright not available: {}", e.message)
            playwright?.close()
            playwright = null
            false
        }
    }

    fun <T> withPage(block: (Page) -> T): T {
        val b = requireNotNull(browser) { "PlaywrightManager is not initialized" }
        val page = b.newPage()
        return try {
            block(page)
        } finally {
            page.close()
        }
    }

    @PreDestroy
    fun close() {
        runCatching { browser?.close() }
        runCatching { playwright?.close() }
    }
}
