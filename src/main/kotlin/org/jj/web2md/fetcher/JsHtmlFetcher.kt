package org.jj.web2md.fetcher

import org.htmlunit.BrowserVersion
import org.htmlunit.WebClient
import org.htmlunit.html.HtmlPage
import org.jj.web2md.config.WebFetcherProperties
import org.jj.web2md.exception.Web2mdException
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.springframework.stereotype.Service
import java.util.logging.Level
import java.util.logging.Logger

@Service
class JsHtmlFetcher(private val properties: WebFetcherProperties) : HtmlFetcherStrategy {

    init {
        Logger.getLogger("org.htmlunit").level = Level.OFF
        Logger.getLogger("com.gargoylesoftware").level = Level.OFF
    }

    override fun fetch(url: String): Document {
        validateUrl(url)
        try {
            WebClient(BrowserVersion.CHROME).use { client ->
                client.options.apply {
                    isJavaScriptEnabled = true
                    isCssEnabled = false
                    isThrowExceptionOnScriptError = false
                    isThrowExceptionOnFailingStatusCode = false
                    isPrintContentOnFailingStatusCode = false
                    timeout = properties.timeoutMillis
                }
                val page: HtmlPage = client.getPage(url)
                // 1단계: 초기 JS 실행 및 페이지 로드 대기
                client.waitForBackgroundJavaScript(properties.js.waitMillis.toLong())
                // 2단계: 초기 JS가 트리거한 추가 비동기 작업(API 호출 등) 대기
                client.waitForBackgroundJavaScriptStartingBefore(properties.js.additionalWaitMillis.toLong())
                return Jsoup.parse(page.asXml(), url)
            }
        } catch (e: Web2mdException) {
            throw e
        } catch (e: Exception) {
            throw Web2mdException.FetchFailedException(url, e)
        }
    }
}
