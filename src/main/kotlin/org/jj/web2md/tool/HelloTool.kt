package org.jj.web2md.tool

import org.springframework.ai.tool.annotation.Tool
import org.springframework.ai.tool.annotation.ToolParam
import org.springframework.stereotype.Service

@Service
class HelloTool {

    @Tool(description = "인사말을 반환합니다")
    fun hello(@ToolParam(description = "이름") name: String): String {
        return "안녕하세요, $name!"
    }
}
