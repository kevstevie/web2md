package org.jj.web2md.fetcher

import org.jj.web2md.config.WebFetcherProperties
import org.jj.web2md.exception.Web2mdException
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.springframework.stereotype.Service

@Service
class StaticHtmlFetcher(private val properties: WebFetcherProperties) : HtmlFetcherStrategy {

    override fun fetch(url: String): Document {
        validateUrl(url)
        try {
            return Jsoup.connect(url)
                .userAgent(properties.userAgent)
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
