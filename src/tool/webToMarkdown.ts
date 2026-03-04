import { z } from 'zod';
import { createFetcher } from '../fetcher/index.js';
import { convertHtmlToMarkdown } from '../converter/htmlToMarkdown.js';
import { summarize } from '../service/summarizer.js';
import { InvalidUrlError, FetchFailedError } from '../utils/errors.js';

export const webToMarkdownInputSchema = z.object({
  url: z.string().describe('The URL of the web page to fetch (http/https only)'),
  summaryLevel: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe('Summary level: 1 (most concise) to 5 (most detailed). Omit for full content.'),
  debug: z
    .boolean()
    .optional()
    .describe('If true, include runtime debug logs in the response text visible to MCP users.'),
});

export type WebToMarkdownInput = z.infer<typeof webToMarkdownInputSchema>;

type DebugStatus = 'success' | 'invalid_url' | 'fetch_failed' | 'unexpected_error';

function redactUrlForDebug(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split('?')[0]?.split('#')[0] ?? url;
  }
}

function withDebugLog(
  resultText: string,
  input: { debug?: boolean; debugUrl: string; summaryLevel?: number },
  runtime: { status: DebugStatus; elapsedMs: number; fetcherName: string; errorName?: string }
): string {
  if (!input.debug) {
    return resultText;
  }

  const lines = [
    '[web2md-debug]',
    `- url: ${input.debugUrl}`,
    `- fetcher: ${runtime.fetcherName}`,
    `- summaryLevel: ${input.summaryLevel ?? 'none'}`,
    `- status: ${runtime.status}`,
    `- elapsedMs: ${runtime.elapsedMs}`,
  ];

  if (runtime.errorName) {
    lines.push(`- error: ${runtime.errorName}`);
  }

  return `${lines.join('\n')}\n\n${resultText}`;
}

export async function webToMarkdownHandler(input: WebToMarkdownInput): Promise<string> {
  const { url, summaryLevel, debug } = input;
  const startedAt = Date.now();
  let fetcherName = 'unknown';

  // Log injection prevention: strip control characters
  const safeUrl = url.replace(/[\r\n\t]/g, '_');
  const debugUrl = redactUrlForDebug(safeUrl);

  try {
    const fetcher = await createFetcher();
    fetcherName = fetcher.constructor?.name ?? 'unknown';
    const html = await fetcher.fetch(url);
    const { title, markdown } = convertHtmlToMarkdown(html);
    // Sanitize title to prevent markdown/prompt injection
    const safeTitle = title.replace(/[\r\n]/g, ' ').trim();
    const fullMarkdown = safeTitle ? `# ${safeTitle}\n\n${markdown}` : markdown;
    const resultText = summaryLevel != null ? summarize(fullMarkdown, summaryLevel) : fullMarkdown;

    return withDebugLog(
      resultText,
      { debug, debugUrl, summaryLevel },
      { status: 'success', elapsedMs: Date.now() - startedAt, fetcherName }
    );
  } catch (e) {
    if (e instanceof InvalidUrlError) {
      process.stderr.write(`[web2md] Invalid URL: ${debugUrl}\n`);
      return withDebugLog(
        'Error: The provided URL is invalid. Only http and https URLs pointing to public hosts are supported.',
        { debug, debugUrl, summaryLevel },
        { status: 'invalid_url', elapsedMs: Date.now() - startedAt, fetcherName, errorName: e.name }
      );
    }
    if (e instanceof FetchFailedError) {
      process.stderr.write(`[web2md] Fetch failed: ${debugUrl}\n`);
      return withDebugLog(
        'Error: Failed to fetch the web page. Please check if the URL is accessible.',
        { debug, debugUrl, summaryLevel },
        { status: 'fetch_failed', elapsedMs: Date.now() - startedAt, fetcherName, errorName: e.name }
      );
    }
    process.stderr.write(`[web2md] Unexpected error for URL: ${debugUrl}\n`);
    const errorName = e instanceof Error ? e.name : 'UnknownError';
    return withDebugLog(
      'Error: An unexpected error occurred while processing the request.',
      { debug, debugUrl, summaryLevel },
      { status: 'unexpected_error', elapsedMs: Date.now() - startedAt, fetcherName, errorName }
    );
  }
}
