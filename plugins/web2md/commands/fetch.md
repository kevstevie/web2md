---
description: Fetch a web page and convert it to Markdown. Optionally summarize with summaryLevel 1-5.
argument-hint: <url> [summaryLevel=1-5] [debug]
allowed-tools: [mcp__web2md__webToMarkdown]
---

# /web2md:fetch Command

convert webpage to markdown

## Arguments

The user invoked this command with: $ARGUMENTS

## Instructions

Parse the arguments as follows (order does not matter):

1. **url** (required): The argument that starts with `http://` or `https://` is the URL.
2. **summaryLevel** (optional): Any integer 1–5, or `summaryLevel=N`. If not provided, **omit this parameter entirely** — do not pass `null` or any string.
3. **debug** (optional): The keyword `debug` or `debug=true` sets `debug=true`. Default is `false`.

Then call `mcp__web2md__webToMarkdown` with the parsed parameters and return the result directly.

## Argument Parsing Examples

| User Input | url | summaryLevel | debug |
|------------|-----|--------------|-------|
| `/web2md:fetch https://example.com` | `https://example.com` | omit | `false` |
| `/web2md:fetch https://example.com 3` | `https://example.com` | `3` | `false` |
| `/web2md:fetch https://example.com summaryLevel=2` | `https://example.com` | `2` | `false` |
| `/web2md:fetch https://example.com debug` | `https://example.com` | omit | `true` |
| `/web2md:fetch https://example.com debug 1` | `https://example.com` | `1` | `true` |
| `/web2md:fetch https://example.com 1 debug` | `https://example.com` | `1` | `true` |

## Output

- Return the markdown content as-is.
- If the result starts with `"Error:"`, display it clearly and suggest solutions:
  - For "invalid URL" errors: remind the user that only http/https URLs to public hosts are supported.
  - For "Failed to fetch" errors: suggest checking network accessibility and retrying with `debug=true` for runtime logs.
- If the result is empty or blank, inform the user that the page content could not be retrieved and suggest checking if the site requires authentication or bot/crawler access.
