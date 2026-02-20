# web2md

An MCP (Model Context Protocol) server that converts web pages to clean Markdown.

MCP(Model Context Protocol) 서버로, 웹 페이지를 깨끗한 마크다운으로 변환합니다.

---

## Why Markdown? / 마크다운을 사용하는 이유

> **LLM Token Savings** — Raw HTML is bloated with tags, scripts, and boilerplate that waste context.
> web2md strips all of that and returns only clean Markdown, drastically reducing the token count fed to your LLM.
> With the optional `summaryLevel` parameter, you can get an extractive summary instead of the full page,
> cutting token usage even further when only an overview is needed.

> **LLM 토큰 절감** — 원본 HTML에는 태그, 스크립트, 불필요한 보일러플레이트가 가득해 컨텍스트 낭비가 큽니다.
> web2md는 이를 모두 제거하고 깨끗한 마크다운만 반환해 LLM에 전달되는 토큰 수를 대폭 줄입니다.
> 선택적인 `summaryLevel` 파라미터를 사용하면 전체 내용 대신 추출 요약본을 받아
> 개요만 필요한 경우 토큰 사용량을 더욱 줄일 수 있습니다.

---

## Installation / 설치

### Option 1: Claude Code Plugin (Recommended / 추천)

MCP 서버, `web-summarize` 스킬, `/web2md` 커맨드를 한 번에 설치합니다.

Installs the MCP server, `web-summarize` skill, and `/web2md` command in one step.

```bash
claude plugin marketplace add kevstevie/web2md
claude plugin install web2md
```

> **Requires Java 17+** for the MCP server.

### Option 2: npm (MCP server only / MCP 서버만)

MCP 서버만 설치합니다. 클라이언트 설정은 직접 해야 합니다.

Installs only the MCP server. Configure your MCP client manually (see below).

```bash
npm install -g web2md-mcp
```

### Option 3: Build from source / 소스에서 빌드

```bash
git clone https://github.com/kevstevie/web2md.git
cd web2md
./gradlew bootJar
```

## Getting Started (Option 3: Source Build) / 시작하기 (소스 빌드)

> Skip this section if you installed via `claude plugin install` or npm.
>
> `claude plugin install` 또는 npm으로 설치했다면 이 섹션은 건너뛰세요.

### Prerequisites / 사전 요구사항

- Java 17+

### Build / 빌드

```bash
./gradlew bootJar
```

### Run / 실행

```bash
java -jar build/libs/web2md.jar
```

The server runs in STDIO mode and communicates via JSON-RPC over stdin/stdout.

서버는 STDIO 모드로 실행되며, stdin/stdout을 통해 JSON-RPC로 통신합니다.

## MCP Client Configuration / MCP 클라이언트 설정

> **Note**: If you installed via `claude plugin install`, the MCP server is already configured automatically. The following is only needed for npm / source installs.
>
> **참고**: `claude plugin install`로 설치했다면 MCP 서버가 자동으로 설정됩니다. 아래는 npm/소스 설치 시에만 필요합니다.

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
      "args": ["-jar", "/absolute/path/to/web2md/build/libs/web2md.jar"]
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
claude mcp add web2md -- java -jar /absolute/path/to/web2md/build/libs/web2md.jar
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

- **Web Page Fetching** - Fetches HTML from any public URL using Jsoup with browser-like headers
- **JavaScript Support** - Renders JavaScript-heavy pages (React, Vue, Angular, etc.) using HtmlUnit with 2-phase async wait
- **Smart Content Extraction** - Automatically finds the main content (`<main>`, `<article>`, `[role=main]`)
- **HTML Cleanup** - Removes scripts, styles, nav, footer, ads, and other non-content elements
- **Markdown Conversion** - Converts clean HTML to Markdown using Flexmark
- **Extractive Summarization** - Summarizes content using TF-IDF + TextRank with Korean morphological analysis (Komoran). No API key required.
- **SSRF Protection** - Blocks requests to private/internal IP addresses (127.0.0.1, 10.x, 192.168.x, etc.)
- **Configurable** - Timeout, max body size, and user agent are configurable via properties
- **Claude Code Plugin** - Bundles `web-summarize` skill (auto-invokes web2md on URL requests) and `/web2md` slash command

---

- **웹 페이지 가져오기** - 브라우저와 유사한 헤더로 Jsoup을 사용하여 공개 URL에서 HTML을 가져옵니다
- **JavaScript 지원** - HtmlUnit을 사용하여 JS로 렌더링되는 페이지(React, Vue, Angular 등)를 2단계 대기 전략으로 처리합니다
- **스마트 본문 추출** - `<main>`, `<article>`, `[role=main]` 순으로 본문을 자동 감지합니다
- **HTML 정리** - script, style, nav, footer, 광고 등 불필요한 요소를 제거합니다
- **마크다운 변환** - Flexmark를 사용하여 정리된 HTML을 마크다운으로 변환합니다
- **추출 요약** - TF-IDF + TextRank 알고리즘과 한국어 형태소 분석기(Komoran)를 활용한 요약. API 키 불필요.
- **SSRF 방어** - 사설/내부 IP(127.0.0.1, 10.x, 192.168.x 등)로의 요청을 차단합니다
- **설정 가능** - timeout, 최대 본문 크기, user agent를 프로퍼티로 설정할 수 있습니다
- **Claude Code 플러그인** - URL 요청 시 자동으로 web2md를 사용하는 `web-summarize` 스킬과 `/web2md` 슬래시 커맨드 포함

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

Fetches a web page and converts it to Markdown.
Use `summaryLevel` to get an extractive summary instead of the full page — ideal for reducing LLM token usage when only an overview is needed.

웹 페이지를 가져와서 마크다운으로 변환합니다.
전체 내용 대신 추출 요약이 필요할 때는 `summaryLevel`을 설정하세요 — LLM 토큰 사용량을 줄이는 데 효과적입니다.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `String` | - | The URL of the web page to fetch (http/https only) |
| `jsEnabled` | `Boolean` | `false` | Set to `true` for JavaScript-rendered SPA pages |
| `summaryLevel` | `Int?` | `null` | Summary level: `1` (most concise) to `5` (most detailed). Omit for full content. |

**Token usage guide / 토큰 사용량 가이드:**

| Mode | `summaryLevel` | Token Usage |
|------|---------------|-------------|
| Full Markdown | `null` | Standard (HTML → clean MD) |
| Brief summary | `1` | Minimum (~10–20% of full) |
| Balanced summary | `3` | Moderate (~30–50% of full) |
| Detailed summary | `5` | Extended (~60–80% of full) |

**Example: full content / 전체 내용:**

```markdown
# Example Domain

This domain is for use in illustrative examples in documents.
You may use this domain in literature without prior coordination or asking for permission.

[More information...](https://www.iana.org/domains/example)
```

**Example: summarized (`summaryLevel=1`) / 요약 (`summaryLevel=1`):**

```markdown
# Example Domain

This domain is for use in illustrative examples in documents.
```

## Configuration / 설정

Configurable via `application.properties`:

`application.properties`를 통해 설정 가능합니다:

| Property | Default | Description |
|----------|---------|-------------|
| `web2md.fetcher.timeout-millis` | `15000` | HTTP request timeout (ms) |
| `web2md.fetcher.max-body-size-bytes` | `5242880` | Max response body size (5MB) |
| `web2md.fetcher.user-agent` | `Mozilla/5.0 (compatible; web2md/1.0)` | User-Agent header |
| `web2md.fetcher.js.wait-millis` | `5000` | Max wait time for initial JS execution (ms) |
| `web2md.fetcher.js.additional-wait-millis` | `2000` | Additional wait for async JS jobs triggered after initial load (ms) |

## Project Structure / 프로젝트 구조

```
web2md/
├── plugins/
│   └── web2md/                    # Claude Code plugin / 플러그인
│       ├── .claude-plugin/
│       │   └── plugin.json        # Plugin manifest / 플러그인 메타데이터
│       ├── .mcp.json              # MCP server auto-config / MCP 서버 자동 설정
│       ├── skills/
│       │   └── web-summarize/
│       │       └── SKILL.md       # Auto-invoke web2md on URL requests / URL 요청 시 자동 실행
│       └── commands/
│           └── web2md.md          # /web2md <url> slash command / 슬래시 커맨드
└── src/main/kotlin/org/jj/web2md/
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
    │   ├── HtmlFetcher.kt             # Jsoup-based static fetcher / 정적 페이지 fetcher
    │   └── JsHtmlFetcher.kt           # HtmlUnit-based JS fetcher / JS 렌더링 fetcher
    ├── converter/
    │   └── HtmlToMarkdownConverter.kt # HTML cleanup + Markdown conversion / HTML 정리 + 변환
    └── exception/
        └── Web2mdExceptions.kt        # Custom exceptions / 커스텀 예외
```

## Limitations / 제한사항

- JavaScript support via HtmlUnit uses the Rhino engine, which may not handle modern ES6+ module-based SPAs (e.g., Vite builds) correctly.
- Maximum body size is 5MB by default.
- Sites protected by Akamai Bot Manager or Cloudflare Bot Manager may return empty or blocked responses.

---

- HtmlUnit의 JS 지원은 Rhino 엔진 기반으로, 최신 ES6+ 모듈 방식의 SPA(Vite 빌드 결과물 등)는 정상적으로 동작하지 않을 수 있습니다.
- 기본 최대 본문 크기는 5MB입니다.
- Akamai Bot Manager 또는 Cloudflare Bot Manager가 적용된 사이트는 빈 응답이나 차단 응답을 반환할 수 있습니다.
