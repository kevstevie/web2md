# web2md

웹 페이지를 마크다운으로 변환하는 MCP(Model Context Protocol) 서버.

## 기술 스택

- **Language**: Kotlin 1.9 / Java 17
- **Framework**: Spring Boot 3.5
- **MCP**: Spring AI 1.0.0 (`spring-ai-starter-mcp-server`)
- **Transport**: STDIO (subprocess 방식)
- **HTML Parsing**: Jsoup 1.18.3
- **Markdown Conversion**: Flexmark 0.64.8 (`flexmark-html2md-converter`)
- **Build**: Gradle (Kotlin DSL)

## 프로젝트 구조

```
src/main/kotlin/org/jj/web2md/
├── Web2mdApplication.kt           # Spring Boot 진입점 (@ConfigurationPropertiesScan)
├── config/
│   ├── McpConfig.kt               # ToolCallbackProvider Bean 등록
│   └── WebFetcherProperties.kt    # 설정 프로퍼티 (timeout, maxBodySize, userAgent)
├── tool/
│   ├── HelloTool.kt               # 샘플 MCP Tool
│   └── WebToMarkdownTool.kt       # 웹→마크다운 변환 MCP Tool
├── fetcher/
│   └── HtmlFetcher.kt             # Jsoup URL fetch + URL 검증
├── converter/
│   └── HtmlToMarkdownConverter.kt # HTML 정리 + Markdown 변환
└── exception/
    └── Web2mdExceptions.kt        # InvalidUrlException, FetchFailedException
```

## 빌드 & 실행

```bash
./gradlew build        # 빌드
./gradlew bootJar      # JAR 생성
java -jar build/libs/web2md-0.0.1-SNAPSHOT.jar  # STDIO 모드로 실행
```

## MCP Tool 추가 방법

1. `tool/` 패키지에 `@Service` 클래스 생성
2. 메서드에 `@Tool(description = "...")` 어노테이션 추가
3. 파라미터에 `@ToolParam(description = "...")` 어노테이션 추가
4. `McpConfig.kt`의 `toolCallbackProvider`에 등록

```kotlin
@Service
class MyTool {
    @Tool(description = "도구 설명")
    fun myMethod(@ToolParam(description = "파라미터 설명") param: String): String {
        return "결과"
    }
}
```

## 주요 설정

- `application.properties`: MCP 서버 설정 (STDIO, SYNC 모드)
- `logback-spring.xml`: 로그를 stderr로 리다이렉트 (stdout은 JSON-RPC 전용)

## 코딩 컨벤션

- 커밋 메시지: `<type>: <description>` (feat, fix, refactor, docs, test, chore)
- 불변성 패턴 사용
- 파일당 800줄 이하, 함수당 50줄 이하

## 문서 관리

- 프로젝트 변경시 README.md를 같이 수정한다.
