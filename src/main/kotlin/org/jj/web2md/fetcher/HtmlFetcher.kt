package org.jj.web2md.fetcher

import org.jj.web2md.config.WebFetcherProperties
import org.jj.web2md.exception.Web2mdException
import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.springframework.stereotype.Service
import java.net.InetAddress
import java.net.URI

@Service
class HtmlFetcher(private val properties: WebFetcherProperties) {

    fun fetch(url: String): Document {
        if (url.isBlank()) {
            throw Web2mdException.InvalidUrlException(url)
        }
        validateUrl(url)
        try {
            return Jsoup.connect(url)
                .userAgent(properties.userAgent)
                .timeout(properties.timeoutMillis)
                .maxBodySize(properties.maxBodySizeBytes)
                .followRedirects(true)
                .get()
        } catch (e: Exception) {
            throw Web2mdException.FetchFailedException(url, e)
        }
    }

    private fun validateUrl(url: String) {
        try {
            val uri = URI(url)
            val scheme = uri.scheme?.lowercase()
            if (scheme != "http" && scheme != "https") {
                throw Web2mdException.InvalidUrlException(url)
            }
            val host = uri.host ?: throw Web2mdException.InvalidUrlException(url)
            if (isPrivateAddress(host)) {
                throw Web2mdException.InvalidUrlException(url)
            }
        } catch (e: Web2mdException) {
            throw e
        } catch (e: Exception) {
            throw Web2mdException.InvalidUrlException(url)
        }
    }

    private fun isPrivateAddress(host: String): Boolean {
        return try {
            val address = InetAddress.getByName(host)
            address.isLoopbackAddress ||
                address.isLinkLocalAddress ||
                address.isSiteLocalAddress ||
                address.isAnyLocalAddress
        } catch (e: Exception) {
            true
        }
    }
}
