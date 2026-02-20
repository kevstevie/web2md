---
name: web-summarize
description: Use this skill when the user provides a URL and asks to summarize, explain, fetch, or retrieve content from it. Triggers include "summarize", "what does this page say", "tell me about this URL", "explain this article", "요약해줘", "정리해줘", "설명해줘", "내용 알려줘", "이 페이지", "이 사이트", "이 링크" with an information request, or when a URL is provided alone. Always use mcp__web2md__webToMarkdown instead of WebFetch when this MCP is available.
version: 0.0.3
---

# Web Page Summarization Pattern

URL이 포함된 페이지 요약/정보 요청은 반드시 `mcp__web2md__webToMarkdown` 도구를 사용한다.

## 트리거 조건

다음 패턴이 포함된 요청에 이 스킬을 적용한다:

- "summarize", "explain", "what does this page say", "tell me about" + URL
- "요약해줘", "정리해줘", "설명해줘" + URL
- "페이지 내용", "사이트 내용", "링크 내용"
- "이 URL", "이 페이지", "이 사이트" + 정보 요청
- URL만 단독으로 주어진 경우

## 도구 사용 규칙

### ALWAYS: web2md 도구 우선 사용

```
// 올바른 방법
mcp__web2md__webToMarkdown(url, jsEnabled, summaryLevel)

// 잘못된 방법 — 사용 금지
WebFetch(url, prompt)   // web2md가 있을 때는 사용하지 않는다
```

### 파라미터 선택 기준

| 상황 | jsEnabled | summaryLevel |
|------|-----------|--------------|
| 일반 정적 페이지 | `false` | 생략 (전체 내용) |
| React/Vue/Angular SPA | `true` | 생략 (전체 내용) |
| 간단한 요약 요청 | `false` | `2` |
| 상세 요약 요청 | `false` | `4` |
| "핵심만" 요청 | `false` | `1` |

### summaryLevel 가이드

- 생략 — 요약 없이 전체 마크다운 반환. **summaryLevel 파라미터를 아예 전달하지 않는다. `null` 문자열 전달 금지.**
- `1` — 가장 간결한 요약
- `2` — 간략 요약
- `3` — 보통 요약
- `4` — 상세 요약
- `5` — 가장 상세한 요약

## 예시

### 사용자가 URL과 함께 요약 요청

```
사용자: https://example.com/article 요약해줘

→ mcp__web2md__webToMarkdown(
    url: "https://example.com/article",
    jsEnabled: false,
    summaryLevel: 3
  )
```

### React SPA 페이지

```
사용자: https://app.example.com/dashboard 내용 알려줘

→ mcp__web2md__webToMarkdown(
    url: "https://app.example.com/dashboard",
    jsEnabled: true
  )
```

### 핵심만 요약

```
사용자: https://blog.example.com/post 핵심만 간단히

→ mcp__web2md__webToMarkdown(
    url: "https://blog.example.com/post",
    jsEnabled: false,
    summaryLevel: 1
  )
```

## 응답 형식

### summaryLevel이 없는 경우 (전체 내용)

web2md가 반환한 마크다운을 그대로 출력한다. 별도 포맷 변환 없음.

### summaryLevel이 있는 경우 (요약)

web2md 결과를 바탕으로 다음 구조로 응답한다:

```markdown
## 요약

[핵심 내용 2-3줄]

## 주요 내용

- [포인트 1]
- [포인트 2]
- [포인트 3]

## 결론

[마무리 한 줄]
```

## 주의사항

- 인증이 필요한 페이지(Google Docs, Confluence, Jira 등)는 web2md로 접근 불가 → 사용자에게 안내
- URL이 없는 경우 web2md 사용 불가 → 사용자에게 URL 요청
- web2md 실패 시 WebFetch로 폴백 허용하되, 폴백 사실을 사용자에게 알린다
- Akamai, Cloudflare Bot Manager가 적용된 사이트는 차단될 수 있음
