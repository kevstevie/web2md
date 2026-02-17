package org.jj.web2md

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class Web2mdApplication

fun main(args: Array<String>) {
    runApplication<Web2mdApplication>(*args)
}
