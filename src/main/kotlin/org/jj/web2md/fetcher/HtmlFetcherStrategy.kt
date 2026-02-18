package org.jj.web2md.fetcher

import org.jj.web2md.exception.Web2mdException
import org.jsoup.nodes.Document
import java.net.InetAddress
import java.net.URI

interface HtmlFetcherStrategy {

    fun fetch(url: String): Document

    fun validateUrl(url: String) {
        if (url.isBlank()) throw Web2mdException.InvalidUrlException(url)
        try {
            val uri = URI(url)
            val scheme = uri.scheme?.lowercase()
            if (scheme != "http" && scheme != "https") throw Web2mdException.InvalidUrlException(url)
            val host = uri.host ?: throw Web2mdException.InvalidUrlException(url)
            if (isPrivateAddress(host)) throw Web2mdException.InvalidUrlException(url)
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
