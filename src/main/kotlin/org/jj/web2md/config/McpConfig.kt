package org.jj.web2md.config

import org.jj.web2md.tool.WebToMarkdownTool
import org.springframework.ai.tool.ToolCallbackProvider
import org.springframework.ai.tool.method.MethodToolCallbackProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class McpConfig {

    @Bean
    fun toolCallbackProvider(
        webToMarkdownTool: WebToMarkdownTool
    ): ToolCallbackProvider {
        return MethodToolCallbackProvider.builder()
            .toolObjects(webToMarkdownTool)
            .build()
    }
}
