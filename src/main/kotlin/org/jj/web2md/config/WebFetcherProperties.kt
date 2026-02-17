package org.jj.web2md.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "web2md.fetcher")
data class WebFetcherProperties(
    val timeoutMillis: Int = 10_000,
    val maxBodySizeBytes: Int = 5 * 1024 * 1024,
    val userAgent: String = "Mozilla/5.0 (compatible; web2md/1.0)"
)
