package org.jj.web2md.fetcher

import com.microsoft.playwright.options.LoadState
import org.jj.web2md.config.WebFetcherProperties
import org.jj.web2md.exception.Web2mdException
import org.jsoup.Jsoup
import org.jsoup.nodes.Document

class PlaywrightHtmlFetcher(
    private val manager: PlaywrightManager,
    private val properties: WebFetcherProperties
) : HtmlFetcherStrategy {

    override fun fetch(url: String): Document {
        validateUrl(url)
        return try {
            manager.withPage { page ->
                // 타임아웃 설정 - StaticHtmlFetcher와 동일한 기준 적용
                page.setDefaultNavigationTimeout(properties.timeoutMillis.toDouble())
                page.setDefaultTimeout(properties.timeoutMillis.toDouble())

                // SSRF 방어: 리다이렉트 및 JS 발행 요청 모두 검증
                // HTTP 리다이렉트 체인과 window.location 이동을 모두 차단
                page.route("**/*") { route ->
                    try {
                        validateUrl(route.request().url())
                        route.resume()
                    } catch (e: Web2mdException.InvalidUrlException) {
                        route.abort("blockedbyclient")
                    }
                }

                page.navigate(url)
                page.waitForLoadState(LoadState.NETWORKIDLE)
                Jsoup.parse(page.content(), url)
            }
        } catch (e: Web2mdException) {
            throw e
        } catch (e: Exception) {
            throw Web2mdException.FetchFailedException(url, e)
        }
    }
}
