---
name: web-summarize
description: When user gives a URL, use mcp__web2md__webToMarkdown. Triggers on bare URLs or fetch/summarize/explain requests.
---

Use `mcp__web2md__webToMarkdown(url, summaryLevel?, debug?)` for all URL requests. Never use WebFetch.

| Case | summaryLevel | debug |
|------|--------------|-------|
| Full page markdown | omit | omit |
| Summary requested | 1–5 | omit |
| Runtime verification needed | optional | `true` |

- **summaryLevel** 1–5 (1=concise, 3=balanced, 5=detailed): omit for full content — do NOT pass `null`.
- **No summaryLevel**: return markdown as-is.
- **With summaryLevel**: respond as Summary / Key Points / Conclusion.
- **debug** is optional and should normally be omitted. Use only when runtime logs are explicitly needed.
- Auth-required pages (Google Docs, Confluence) are inaccessible — inform user.
- If web2md fails, report the returned error and suggest retrying with `debug=true` when troubleshooting.
