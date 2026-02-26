package org.jj.web2md.fetcher

import com.microsoft.playwright.options.LoadState
import org.jj.web2md.exception.Web2mdException
import org.jsoup.Jsoup
import org.jsoup.nodes.Document

class PlaywrightHtmlFetcher(private val manager: PlaywrightManager) : HtmlFetcherStrategy {

    override fun fetch(url: String): Document {
        validateUrl(url)
        return try {
            manager.withPage { page ->
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
