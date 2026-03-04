---
name: web-summarize
description: When user gives a URL, use mcp__web2md__webToMarkdown. Triggers on bare URLs or fetch/summarize/explain requests.
version: 0.0.4
---

Use `mcp__web2md__webToMarkdown(url, jsEnabled?, summaryLevel?)` for all URL requests. Never use WebFetch.

| Case | jsEnabled | summaryLevel |
|------|-----------|--------------|
| Static page | `false` | omit |
| SPA (React/Vue/Angular) | `true` | omit |
| Summary requested | `false` | 1–5 |

- **summaryLevel** 1–5 (1=concise, 3=balanced, 5=detailed): omit for full content — do NOT pass `null`.
- **No summaryLevel**: return markdown as-is.
- **With summaryLevel**: respond as Summary / Key Points / Conclusion.
- Auth-required pages (Google Docs, Confluence) are inaccessible — inform user.
- If web2md fails, fall back to WebFetch and notify user.
