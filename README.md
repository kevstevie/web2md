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

### Option 2: Claude Code — MCP only / MCP 서버만 등록

Claude Code에 MCP 서버만 바로 등록합니다.

```bash
claude mcp add web2md -- npx -y web2md-mcp@latest
```

> **Requires Java 17+** for the MCP server.

### Option 3: Build from source / 소스에서 빌드

```bash
git clone https://github.com/kevstevie/web2md.git
cd web2md
./gradlew bootJar
```

---

## Getting Started (Source Build) / 시작하기 (소스 빌드)

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

---

## Claude Desktop Configuration / Claude Desktop 설정

Option 1~3으로 설치 후, `claude_desktop_config.json`에 아래 내용을 추가하세요.

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

---

## Playwright Setup (JavaScript Support) / Playwright 설정 (JavaScript 지원)

`jsEnabled=true` 옵션으로 React, Vue, Angular 등 JavaScript 렌더링 페이지를 처리하려면 Playwright 브라우저 바이너리가 필요합니다.

To fetch JavaScript-rendered pages (React, Vue, Angular, etc.) with `jsEnabled=true`, install Playwright browser binaries.

### Install Playwright browsers / Playwright 브라우저 설치

**Step 1: Build the JAR (if not already built)**

```bash
./gradlew bootJar
```

**Step 2: Install Chromium via Playwright CLI**

```bash
java -cp build/libs/web2md.jar com.microsoft.playwright.CLI install chromium
```

Or install all browsers:

```bash
java -cp build/libs/web2md.jar com.microsoft.playwright.CLI install
```

> **Note (Linux):** You may need system dependencies. Run:
>
> ```bash
> java -cp build/libs/web2md.jar com.microsoft.playwright.CLI install-deps chromium
> ```
>
> **참고 (Linux):** 시스템 의존성이 필요할 수 있습니다.

### Engine configuration / 엔진 설정

`application.properties`에서 fetcher 엔진을 선택할 수 있습니다:

```properties
# auto    — Playwright가 설치된 경우 자동 사용, 없으면 Jsoup 폴백 (기본값)
# playwright — Playwright 강제 사용 (미설치 시 Jsoup 폴백 + 경고)
# jsoup   — 항상 Jsoup 사용 (JavaScript 미지원)
web2md.fetcher.engine=auto
```

| Value | Behavior |
|-------|----------|
| `auto` | Uses Playwright if installed, falls back to Jsoup (default) |
| `playwright` | Forces Playwright; warns and falls back to Jsoup if not installed |
| `jsoup` | Always uses Jsoup (no JavaScript support) |

---

## MCP-only Mode / MCP 서버만 실행

Playwright 없이 정적 페이지 전용으로 가볍게 실행할 때 유용합니다.

Useful for lightweight deployments that only need static page fetching without Playwright.

### Jsoup only (no Playwright required) / Jsoup 전용 실행

```bash
java -jar build/libs/web2md.jar \
  --web2md.fetcher.engine=jsoup
```

### With Playwright (full JS support) / Playwright 포함 실행

```bash
java -jar build/libs/web2md.jar \
  --web2md.fetcher.engine=playwright
```

### MCP server with Claude Code (one-liner) / Claude Code용 한 줄 실행

**Jsoup only:**

```bash
claude mcp add web2md -- java -jar /path/to/web2md.jar --web2md.fetcher.engine=jsoup
```

**With Playwright:**

```bash
claude mcp add web2md -- java -jar /path/to/web2md.jar --web2md.fetcher.engine=playwright
```

---

## Features / 기능

- **Web Page Fetching** - Fetches HTML from any public URL using Jsoup with browser-like headers
- **Playwright Support** - Renders JavaScript-heavy pages (React, Vue, Angular, etc.) using Playwright (Chromium)
- **Smart Content Extraction** - Automatically finds the main content (`<main>`, `<article>`, `[role=main]`)
- **HTML Cleanup** - Removes scripts, styles, nav, footer, ads, and other non-content elements
- **Markdown Conversion** - Converts clean HTML to Markdown using Flexmark
- **Extractive Summarization** - Summarizes content using TF-IDF + TextRank with Korean morphological analysis (Komoran). No API key required.
- **SSRF Protection** - Blocks requests to private/internal IP addresses (127.0.0.1, 10.x, 192.168.x, etc.) including redirect chains and JS-issued requests
- **Configurable** - Timeout, max body size, user agent, and engine are configurable via properties
- **Claude Code Plugin** - Bundles `web-summarize` skill (auto-invokes web2md on URL requests) and `/web2md` slash command

---

- **웹 페이지 가져오기** - 브라우저와 유사한 헤더로 Jsoup을 사용하여 공개 URL에서 HTML을 가져옵니다
- **Playwright 지원** - Playwright(Chromium)을 사용하여 JS로 렌더링되는 페이지(React, Vue, Angular 등)를 처리합니다
- **스마트 본문 추출** - `<main>`, `<article>`, `[role=main]` 순으로 본문을 자동 감지합니다
- **HTML 정리** - script, style, nav, footer, 광고 등 불필요한 요소를 제거합니다
- **마크다운 변환** - Flexmark를 사용하여 정리된 HTML을 마크다운으로 변환합니다
- **추출 요약** - TF-IDF + TextRank 알고리즘과 한국어 형태소 분석기(Komoran)를 활용한 요약. API 키 불필요.
- **SSRF 방어** - 사설/내부 IP(127.0.0.1, 10.x, 192.168.x 등)로의 요청 및 리다이렉트·JS 발행 요청을 모두 차단합니다
- **설정 가능** - timeout, 최대 본문 크기, user agent, 엔진을 프로퍼티로 설정할 수 있습니다
- **Claude Code 플러그인** - URL 요청 시 자동으로 web2md를 사용하는 `web-summarize` 스킬과 `/web2md` 슬래시 커맨드 포함

---

## Tech Stack / 기술 스택

| Component | Technology |
|-----------|------------|
| Language | Kotlin 1.9 / Java 17 |
| Framework | Spring Boot 3.5 |
| MCP | Spring AI 1.0.0 (`spring-ai-starter-mcp-server`) |
| Transport | STDIO |
| HTML Parsing | Jsoup 1.18.3 |
| JS Rendering | Playwright 1.49.0 (Chromium) |
| Markdown Conversion | Flexmark 0.64.8 |
| Summarization | TF-IDF + TextRank |
| Korean NLP | Komoran 3.3.9 |
| Build | Gradle (Kotlin DSL) |

---

## Available Tools / 사용 가능한 도구

### `webToMarkdown`

Fetches a web page and converts it to Markdown.
Use `summaryLevel` to get an extractive summary instead of the full page — ideal for reducing LLM token usage when only an overview is needed.

웹 페이지를 가져와서 마크다운으로 변환합니다.
전체 내용 대신 추출 요약이 필요할 때는 `summaryLevel`을 설정하세요 — LLM 토큰 사용량을 줄이는 데 효과적입니다.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | `String` | - | The URL of the web page to fetch (http/https only) |
| `jsEnabled` | `Boolean` | `false` | Set to `true` for JavaScript-rendered SPA pages (requires Playwright) |
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

---

## Configuration / 설정

Configurable via `application.properties` or command-line arguments:

`application.properties` 또는 커맨드라인 인수로 설정 가능합니다:

| Property | Default | Description |
|----------|---------|-------------|
| `web2md.fetcher.engine` | `auto` | Fetcher engine: `auto` \| `jsoup` \| `playwright` |
| `web2md.fetcher.timeout-millis` | `15000` | HTTP request timeout (ms) |
| `web2md.fetcher.max-body-size-bytes` | `5242880` | Max response body size (5MB) |
| `web2md.fetcher.user-agent` | `Mozilla/5.0 (compatible; web2md/1.0)` | User-Agent header |

---

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
    │   ├── FetcherConfig.kt           # Fetcher engine selection (auto/jsoup/playwright)
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
    │   ├── PlaywrightHtmlFetcher.kt   # Playwright-based JS fetcher / JS 렌더링 fetcher
    │   └── PlaywrightManager.kt       # Playwright lifecycle manager / Playwright 생명주기 관리
    ├── converter/
    │   └── HtmlToMarkdownConverter.kt # HTML cleanup + Markdown conversion / HTML 정리 + 변환
    └── exception/
        └── Web2mdExceptions.kt        # Custom exceptions / 커스텀 예외
```

---

## Limitations / 제한사항

- Maximum body size is 5MB by default.
- Sites protected by Cloudflare Bot Manager or similar anti-bot systems may return empty or blocked responses.
- Playwright requires browser binaries to be installed separately (see [Playwright Setup](#playwright-setup-javascript-support--playwright-설정-javascript-지원) above).

---

- 기본 최대 본문 크기는 5MB입니다.
- Cloudflare Bot Manager 등 봇 차단이 적용된 사이트는 빈 응답이나 차단 응답을 반환할 수 있습니다.
- Playwright는 브라우저 바이너리를 별도로 설치해야 합니다 (위 [Playwright 설정](#playwright-setup-javascript-support--playwright-설정-javascript-지원) 참고).
