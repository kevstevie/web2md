---
description: Fetch a web page and convert it to Markdown. Optionally summarize with summaryLevel 1-5.
argument-hint: <url> [summaryLevel=1-5] [js]
allowed-tools: [mcp__web2md__webToMarkdown]
---

# /web2md Command

웹 페이지를 마크다운으로 변환합니다.

## Arguments

The user invoked this command with: $ARGUMENTS

## Instructions

Parse the arguments as follows:

1. **url** (required): The first argument is always the URL to fetch.
2. **summaryLevel** (optional): If the user passes `summaryLevel=N` (e.g. `summaryLevel=3`) or just a number (e.g. `3`), use it as the summary level (1–5). If not provided, use `null` for full content.
3. **js** (optional): If the user passes `js` or `js=true`, set `jsEnabled=true`. Default is `false`.

Then call `mcp__web2md__webToMarkdown` with the parsed parameters and return the result directly.

## Argument Parsing Examples

| User Input | url | jsEnabled | summaryLevel |
|------------|-----|-----------|--------------|
| `/web2md https://example.com` | `https://example.com` | `false` | `null` |
| `/web2md https://example.com 3` | `https://example.com` | `false` | `3` |
| `/web2md https://example.com summaryLevel=2` | `https://example.com` | `false` | `2` |
| `/web2md https://example.com js` | `https://example.com` | `true` | `null` |
| `/web2md https://example.com js 1` | `https://example.com` | `true` | `1` |

## Output

Return the markdown content as-is. If the result starts with "Error:", display it clearly to the user.
