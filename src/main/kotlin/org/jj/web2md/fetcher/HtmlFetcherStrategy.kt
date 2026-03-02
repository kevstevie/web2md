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
            // getAllByName으로 모든 A/AAAA 레코드를 확인 (IPv6 포함)
            val addresses = InetAddress.getAllByName(host)
            addresses.any { address ->
                address.isLoopbackAddress ||      // 127.x.x.x, ::1
                    address.isLinkLocalAddress ||  // 169.254.x.x, fe80::/10
                    address.isSiteLocalAddress ||  // 10.x, 172.16-31.x, 192.168.x.x, fc00::/7
                    address.isAnyLocalAddress ||   // 0.0.0.0, ::
                    address.isMulticastAddress ||  // 224.x - 239.x
                    isCloudMetadataAddress(address)
            }
        } catch (e: Exception) {
            true  // 해석 실패 시 차단 (fail-closed)
        }
    }

    // 클라우드 메타데이터 엔드포인트 명시 차단 (link-local로 분류되지 않는 경우 대비)
    private fun isCloudMetadataAddress(address: InetAddress): Boolean {
        val ip = address.hostAddress
        return ip == "168.63.129.16" ||   // Azure IMDS
            ip.startsWith("169.254.")     // AWS/GCP IMDS (link-local이지만 명시적 추가)
    }
}
