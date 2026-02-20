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

Parse the arguments as follows (order does not matter):

1. **url** (required): The argument that starts with `http://` or `https://` is the URL.
2. **summaryLevel** (optional): Any integer 1–5, or `summaryLevel=N`. If not provided, **omit this parameter entirely** — do not pass `null` or any string.
3. **js** (optional): The keyword `js` or `js=true` sets `jsEnabled=true`. Default is `false`.

Then call `mcp__web2md__webToMarkdown` with the parsed parameters and return the result directly.

## Argument Parsing Examples

| User Input | url | jsEnabled | summaryLevel |
|------------|-----|-----------|--------------|
| `/web2md https://example.com` | `https://example.com` | `false` | 생략 |
| `/web2md https://example.com 3` | `https://example.com` | `false` | `3` |
| `/web2md https://example.com summaryLevel=2` | `https://example.com` | `false` | `2` |
| `/web2md https://example.com js` | `https://example.com` | `true` | 생략 |
| `/web2md https://example.com js 1` | `https://example.com` | `true` | `1` |
| `/web2md https://example.com 1 js` | `https://example.com` | `true` | `1` |

## Output

- Return the markdown content as-is.
- If the result starts with `"Error:"`, display it clearly and suggest solutions:
  - For "invalid URL" errors: remind the user that only http/https URLs to public hosts are supported.
  - For "Failed to fetch" errors: suggest trying `js` flag if the site uses JavaScript rendering.
- If the result is empty or blank, inform the user that the page content could not be retrieved and suggest trying the `js` flag or checking if the site requires authentication.
