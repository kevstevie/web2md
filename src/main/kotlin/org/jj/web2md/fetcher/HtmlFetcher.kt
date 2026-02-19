package org.jj.web2md.fetcher

import org.jj.web2md.config.WebFetcherProperties
import org.jj.web2md.exception.Web2mdException
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.springframework.stereotype.Service

@Service
class StaticHtmlFetcher(private val properties: WebFetcherProperties) : HtmlFetcherStrategy {

    override fun fetch(url: String): Document = fetchWithUserAgent(url, properties.userAgent)

    fun fetchWithUserAgent(url: String, userAgent: String): Document {
        validateUrl(url)
        try {
            return Jsoup.connect(url)
                .userAgent(userAgent)
                .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
                .header("Accept-Encoding", "gzip")
                .timeout(properties.timeoutMillis)
                .maxBodySize(properties.maxBodySizeBytes)
                .followRedirects(true)
                .get()
        } catch (e: Web2mdException) {
            throw e
        } catch (e: Exception) {
            throw Web2mdException.FetchFailedException(url, e)
        }
    }
}
