# web2md

웹 페이지를 마크다운으로 변환하는 MCP(Model Context Protocol) 서버.

## 기술 스택

- **Language**: TypeScript 5 / Node.js 18+
- **MCP SDK**: `@modelcontextprotocol/sdk` (StdioServerTransport)
- **HTML Parsing**: cheerio
- **Markdown Conversion**: turndown
- **JS 렌더링**: Playwright (설치된 경우 자동 사용)
- **Build**: tsc
- **Test**: vitest

## 프로젝트 구조

```
src/
├── index.ts                        # MCP 서버 진입점
├── config/
│   └── constants.ts                # 공유 상수 (timeout, maxBodySize 등)
├── tool/
│   └── webToMarkdown.ts            # MCP Tool 정의 및 핸들러
├── fetcher/
│   ├── types.ts                    # HtmlFetcher 인터페이스
│   ├── staticFetcher.ts            # Node fetch() 기반 정적 fetcher
│   ├── playwrightFetcher.ts        # Playwright 기반 JS 렌더링 fetcher
│   └── index.ts                    # 팩토리: playwright 설치 여부 자동 감지
├── converter/
│   └── htmlToMarkdown.ts           # cheerio 정리 + turndown 변환
├── service/
│   ├── summarizer.ts               # 섹션 기반 추출 요약
│   ├── textRank.ts                 # TF-IDF + TextRank
│   └── tokenizer/
│       ├── types.ts
│       ├── simpleTokenizer.ts      # 영어 토크나이저
│       └── koreanTokenizer.ts      # 한국어 토크나이저
└── utils/
    ├── ssrf.ts                     # SSRF URL 검증
    └── errors.ts                   # InvalidUrlError, FetchFailedError
```

## 빌드 & 실행

```bash
npm install            # 의존성 설치 (postinstall로 Chromium 자동 설치 시도)
npm run build          # TypeScript 빌드 → dist/
npm start              # MCP 서버 실행 (STDIO)
npm test               # 테스트 실행
npm run test:coverage  # 커버리지 포함 테스트
```

## MCP Tool

### webToMarkdown
- `url: string` — http/https URL (필수)
- `summaryLevel?: 1|2|3|4|5` — 요약 레벨 (생략 시 전체 반환)

Playwright 설치 여부는 자동 감지 (playwright npm 패키지 + Chromium 바이너리 모두 있어야 활성화).

## 로컬 MCP 추가

```bash
# 빌드 후
claude mcp add web2md-mcp node /path/to/web2md/dist/index.js
```

## 코딩 컨벤션

- 커밋 메시지: `<type>: <description>` (feat, fix, refactor, docs, test, chore)
- 불변성 패턴 사용
- 파일당 800줄 이하, 함수당 50줄 이하

## 문서 관리

- 프로젝트 변경 시 README.md를 같이 수정한다.

# currentDate
Today's date is 2026-03-04.
