package org.jj.web2md.config

import org.jj.web2md.tool.HelloTool
import org.springframework.ai.tool.ToolCallbackProvider
import org.springframework.ai.tool.method.MethodToolCallbackProvider
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class McpConfig {

    @Bean
    fun toolCallbackProvider(helloTool: HelloTool): ToolCallbackProvider {
        return MethodToolCallbackProvider.builder()
            .toolObjects(helloTool)
            .build()
    }
}
