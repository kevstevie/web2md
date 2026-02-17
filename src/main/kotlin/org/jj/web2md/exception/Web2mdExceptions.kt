package org.jj.web2md.exception

sealed class Web2mdException(message: String, cause: Throwable? = null) : RuntimeException(message, cause) {

    class InvalidUrlException(url: String) :
        Web2mdException("Invalid URL: '$url'. Only http and https protocols are supported.")

    class FetchFailedException(url: String, cause: Throwable) :
        Web2mdException("Failed to fetch URL: '$url'. Reason: ${cause.message}", cause)
}
