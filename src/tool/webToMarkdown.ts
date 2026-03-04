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
});

export type WebToMarkdownInput = z.infer<typeof webToMarkdownInputSchema>;

export async function webToMarkdownHandler(input: WebToMarkdownInput): Promise<string> {
  const { url, summaryLevel } = input;

  // Log injection prevention: strip control characters
  const safeUrl = url.replace(/[\r\n\t]/g, '_');

  try {
    const fetcher = await createFetcher();
    const html = await fetcher.fetch(url);
    const { title, markdown } = convertHtmlToMarkdown(html);
    // Sanitize title to prevent markdown/prompt injection
    const safeTitle = title.replace(/[\r\n]/g, ' ').trim();
    const fullMarkdown = safeTitle ? `# ${safeTitle}\n\n${markdown}` : markdown;

    if (summaryLevel != null) {
      return summarize(fullMarkdown, summaryLevel);
    }
    return fullMarkdown;
  } catch (e) {
    if (e instanceof InvalidUrlError) {
      process.stderr.write(`[web2md] Invalid URL: ${safeUrl}\n`);
      return 'Error: The provided URL is invalid. Only http and https URLs pointing to public hosts are supported.';
    }
    if (e instanceof FetchFailedError) {
      process.stderr.write(`[web2md] Fetch failed: ${safeUrl}\n`);
      return 'Error: Failed to fetch the web page. Please check if the URL is accessible.';
    }
    process.stderr.write(`[web2md] Unexpected error for URL: ${safeUrl}\n`);
    return 'Error: An unexpected error occurred while processing the request.';
  }
}
