# web2md

An MCP (Model Context Protocol) server that converts web pages to clean Markdown.

MCP(Model Context Protocol) 서버로, 웹 페이지를 깨끗한 마크다운으로 변환합니다.

## Installation / 설치

### Option 1: npm (Recommended / 추천)

No build required. Just configure and use.

빌드 없이 바로 사용할 수 있습니다.

```bash
npm install -g web2md-mcp
```

### Option 2: Build from source / 소스에서 빌드

```bash
git clone https://github.com/kevstevie/web2md.git
cd web2md
./gradlew bootJar
```

## Getting Started / 시작하기

### Prerequisites / 사전 요구사항

- Java 17+

### Build / 빌드

```bash
./gradlew build
```

### Run / 실행

```bash
java -jar build/libs/web2md-0.0.1-SNAPSHOT.jar
```

The server runs in STDIO mode and communicates via JSON-RPC over stdin/stdout.

서버는 STDIO 모드로 실행되며, stdin/stdout을 통해 JSON-RPC로 통신합니다.

## MCP Client Configuration / MCP 클라이언트 설정

### Claude Desktop

Add the following to your `claude_desktop_config.json`:

`claude_desktop_config.json`에 아래 내용을 추가하세요:

**Via npm:**

```json
{
  "mcpServers": {
    "web2md": {
      "command": "npx",
      "args": ["-y", "web2md-mcp@latest"]
    }
  }
}
```

**Via git clone:**

```json
{
  "mcpServers": {
    "web2md": {
      "command": "java",
      "args": ["-jar", "/absolute/path/to/web2md/build/libs/web2md-0.0.1-SNAPSHOT.jar"]
    }
  }
}
```

### Claude Code

Run one of the following commands in your terminal:

터미널에서 아래 명령어 중 하나를 실행하세요:

**Via npm:**

```bash
claude mcp add web2md -- npx -y web2md-mcp@latest
```

**Via git clone:**

```bash
claude mcp add web2md -- java -jar /absolute/path/to/web2md/build/libs/web2md-0.0.1-SNAPSHOT.jar
```

Or manually add to `.claude/settings.json`:

또는 `.claude/settings.json`에 직접 추가하세요:

```json
{
  "mcpServers": {
    "web2md": {
      "command": "npx",
      "args": ["-y", "web2md-mcp@latest"]
    }
  }
}
```

## Features / 기능

- **Web Page Fetching** - Fetches HTML from any public URL using Jsoup
- **JavaScript Support** - Renders JavaScript-heavy pages (React, Vue, Angular, etc.) using HtmlUnit
- **Smart Content Extraction** - Automatically finds the main content (`<main>`, `<article>`, `[role=main]`)
- **HTML Cleanup** - Removes scripts, styles, nav, footer, ads, and other non-content elements
- **Markdown Conversion** - Converts clean HTML to Markdown using Flexmark
- **Extractive Summarization** - Summarizes content using TF-IDF + TextRank with Korean morphological analysis (Komoran). No API key required.
- **SSRF Protection** - Blocks requests to private/internal IP addresses (127.0.0.1, 10.x, 192.168.x, etc.)
- **Configurable** - Timeout, max body size, and user agent are configurable via properties

---

- **웹 페이지 가져오기** - Jsoup을 사용하여 공개 URL에서 HTML을 가져옵니다
- **JavaScript 지원** - HtmlUnit을 사용하여 JS로 렌더링되는 페이지(React, Vue, Angular 등)를 처리합니다
- **스마트 본문 추출** - `<main>`, `<article>`, `[role=main]` 순으로 본문을 자동 감지합니다
- **HTML 정리** - script, style, nav, footer, 광고 등 불필요한 요소를 제거합니다
- **마크다운 변환** - Flexmark를 사용하여 정리된 HTML을 마크다운으로 변환합니다
- **추출 요약** - TF-IDF + TextRank 알고리즘과 한국어 형태소 분석기(Komoran)를 활용한 요약. API 키 불필요.
- **SSRF 방어** - 사설/내부 IP(127.0.0.1, 10.x, 192.168.x 등)로의 요청을 차단합니다
- **설정 가능** - timeout, 최대 본문 크기, user agent를 프로퍼티로 설정할 수 있습니다

## Tech Stack / 기술 스택

| Component | Technology |
|-----------|------------|
| Language | Kotlin 1.9 / Java 17 |
| Framework | Spring Boot 3.5 |
| MCP | Spring AI 1.0.0 (`spring-ai-starter-mcp-server`) |
| Transport | STDIO |
| HTML Parsing | Jsoup 1.18.3 |
| JS Rendering | HtmlUnit 4.21.0 |
| Markdown Conversion | Flexmark 0.64.8 |
| Summarization | TF-IDF + TextRank |
| Korean NLP | Komoran 3.3.9 |
| Build | Gradle (Kotlin DSL) |

## Available Tools / 사용 가능한 도구

### `webToMarkdown`

Fetches a web page and converts it to Markdown. Use `summarize=true` when only an overview is needed to reduce context size.

웹 페이지를 가져와서 마크다운으로 변환합니다. 개요만 필요할 때는 `summarize=true`로 컨텍스트 크기를 줄일 수 있습니다.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `String` | - | The URL of the web page to fetch (http/https only) |
| `jsEnabled` | `Boolean` | `false` | Set to `true` for JavaScript-rendered SPA pages |
| `summarize` | `Boolean` | `false` | Set to `true` to return an extractive summary instead of full Markdown |

**Example: full content / 전체 내용:**

```markdown
# Example Domain

This domain is for use in illustrative examples in documents.
You may use this domain in literature without prior coordination or asking for permission.

[More information...](https://www.iana.org/domains/example)
```

**Example: summarized (`summarize=true`) / 요약 (`summarize=true`):**

```markdown
# Example Domain

This domain is for use in illustrative examples in documents.
```

## Configuration / 설정

Configurable via `application.properties`:

`application.properties`를 통해 설정 가능합니다:

| Property | Default | Description |
|----------|---------|-------------|
| `web2md.fetcher.timeout-millis` | `10000` | HTTP request timeout (ms) |
| `web2md.fetcher.max-body-size-bytes` | `5242880` | Max response body size (5MB) |
| `web2md.fetcher.user-agent` | `Mozilla/5.0 (compatible; web2md/1.0)` | User-Agent header |
| `web2md.fetcher.js.wait-millis` | `3000` | Max wait time for JS execution (ms) |

## Project Structure / 프로젝트 구조

```
src/main/kotlin/org/jj/web2md/
├── Web2mdApplication.kt           # Entry point / 진입점
├── config/
│   ├── McpConfig.kt               # MCP tool registration / MCP 도구 등록
│   ├── TokenizerConfig.kt         # Tokenizer bean (auto language detection) / 언어 자동 감지
│   └── WebFetcherProperties.kt    # Configuration properties / 설정 프로퍼티
├── tool/
│   └── WebToMarkdownTool.kt       # MCP tool (fetch + convert + optional summarize)
├── service/
│   ├── MarkdownSummarizer.kt      # Section-aware extractive summarizer / 섹션 기반 추출 요약기
│   ├── TextRankSummarizer.kt      # TF-IDF + TextRank sentence ranker / 문장 중요도 계산
│   └── tokenizer/
│       ├── Tokenizer.kt           # Tokenizer interface / 토크나이저 인터페이스
│       ├── SimpleTokenizer.kt     # English tokenizer (stop word filtering) / 영어 토크나이저
│       └── KoreanTokenizer.kt     # Korean morphological analyzer (Komoran) / 한국어 형태소 분석
├── fetcher/
│   ├── HtmlFetcherStrategy.kt     # Fetcher interface / Fetcher 인터페이스
│   ├── StaticHtmlFetcher.kt       # Jsoup-based static fetcher / 정적 페이지 fetcher
│   └── JsHtmlFetcher.kt           # HtmlUnit-based JS fetcher / JS 렌더링 fetcher
├── converter/
│   └── HtmlToMarkdownConverter.kt # HTML cleanup + Markdown conversion / HTML 정리 + 변환
└── exception/
    └── Web2mdExceptions.kt        # Custom exceptions / 커스텀 예외
```

## Limitations / 제한사항

- JavaScript support via HtmlUnit uses the Rhino engine, which may not handle modern ES6+ module-based SPAs (e.g., Vite builds) correctly.
- Maximum body size is 5MB by default.

---

- HtmlUnit의 JS 지원은 Rhino 엔진 기반으로, 최신 ES6+ 모듈 방식의 SPA(Vite 빌드 결과물 등)는 정상적으로 동작하지 않을 수 있습니다.
- 기본 최대 본문 크기는 5MB입니다.
