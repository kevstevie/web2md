package org.jj.web2md.config

import org.jj.web2md.fetcher.HtmlFetcherStrategy
import org.jj.web2md.fetcher.PlaywrightHtmlFetcher
import org.jj.web2md.fetcher.PlaywrightManager
import org.jj.web2md.fetcher.StaticHtmlFetcher
import org.slf4j.LoggerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Primary

@Configuration
class FetcherConfig(
    private val staticHtmlFetcher: StaticHtmlFetcher,
    private val playwrightManager: PlaywrightManager,
    private val properties: WebFetcherProperties
) {

    private val logger = LoggerFactory.getLogger(javaClass)

    @Bean
    @Primary
    fun htmlFetcher(): HtmlFetcherStrategy {
        val usePlaywright = when (properties.engine) {
            "playwright" -> playwrightManager.initialize().also { ok ->
                if (!ok) logger.warn("engine=playwright 설정이지만 Playwright를 초기화할 수 없습니다. Jsoup으로 폴백합니다.")
            }
            "jsoup" -> false
            else -> playwrightManager.initialize()  // "auto"
        }

        return if (usePlaywright) {
            logger.info("Playwright 감지됨 → PlaywrightHtmlFetcher 사용")
            PlaywrightHtmlFetcher(playwrightManager)
        } else {
            logger.info("Playwright 미설치 → StaticHtmlFetcher (Jsoup) 사용")
            staticHtmlFetcher
        }
    }
}
