---
name: web-summarize
description: Use this skill when the user provides a URL and asks to summarize, explain, fetch, or retrieve content from it. Triggers include "summarize", "what does this page say", "tell me about this URL", "explain this article", "요약해줘", "정리해줘", "설명해줘", "내용 알려줘", "이 페이지", "이 사이트", "이 링크" with an information request, or when a URL is provided alone. Always use mcp__web2md__webToMarkdown instead of WebFetch when this MCP is available.
version: 0.0.4
---

# Web Page Summarization Pattern

Always use `mcp__web2md__webToMarkdown` for URL content requests.

## Trigger Conditions

- "summarize", "explain", "what does this page say", "tell me about" + URL
- "요약해줘", "정리해줘", "설명해줘" + URL
- "페이지 내용", "사이트 내용", "링크 내용"
- "이 URL", "이 페이지", "이 사이트" + information request
- URL provided alone

## Tool Usage

```
// CORRECT
mcp__web2md__webToMarkdown(url, jsEnabled, summaryLevel)

// FORBIDDEN — do not use when web2md is available
WebFetch(url, prompt)
```

## Parameter Guide

| Situation | jsEnabled | summaryLevel |
|-----------|-----------|--------------|
| Static page | `false` | omit (full content) |
| React/Vue/Angular SPA | `true` | omit (full content) |
| Brief summary request | `false` | `2` |
| Detailed summary request | `false` | `4` |
| "핵심만" / concise only | `false` | `1` |

### summaryLevel

- Omit — returns full markdown. **Do NOT pass `null` or any string. Omit the parameter entirely.**
- `1` — most concise
- `2` — brief
- `3` — moderate
- `4` — detailed
- `5` — most detailed

## Examples

### Summary request

```
User: https://example.com/article 요약해줘

→ mcp__web2md__webToMarkdown(
    url: "https://example.com/article",
    jsEnabled: false,
    summaryLevel: 3
  )
```

### SPA page

```
User: https://app.example.com/dashboard 내용 알려줘

→ mcp__web2md__webToMarkdown(
    url: "https://app.example.com/dashboard",
    jsEnabled: true
  )
```

### Concise only

```
User: https://blog.example.com/post 핵심만 간단히

→ mcp__web2md__webToMarkdown(
    url: "https://blog.example.com/post",
    jsEnabled: false,
    summaryLevel: 1
  )
```

## Response Format

- **No summaryLevel**: return web2md markdown as-is, no reformatting.
- **With summaryLevel**: structure response as:

```markdown
## 요약
[2-3 sentence summary]

## 주요 내용
- [point 1]
- [point 2]
- [point 3]

## 결론
[one-line conclusion]
```

## Notes

- Pages requiring auth (Google Docs, Confluence, Jira, etc.) are not accessible — inform the user.
- No URL provided — ask the user for a URL.
- If web2md fails, fall back to WebFetch but notify the user.
- Sites protected by Akamai or Cloudflare Bot Manager may be blocked.
