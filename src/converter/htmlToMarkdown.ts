import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const REMOVABLE_TAGS = [
  'script', 'style', 'nav', 'footer', 'header',
  'form', 'iframe', 'noscript', 'svg', 'button',
];
const CONTENT_SELECTORS = ['main', 'article', '[role="main"]', 'body'];
const REMOVABLE_CLASSES = '.ad, .ads, .advertisement, .sidebar, .popup, .modal, .cookie-banner';

const CONSECUTIVE_BLANK_LINES = /\n{3,}/g;
const TRAILING_WHITESPACE = /[ \t]+\n/g;
const BASE64_IMAGE = /!\[[^\]]*\]\(data:[^)]*\)/g;
const EMPTY_IMAGE = /!\[\]\([^)]*\)/g;
// Only strip known Markdown extended attribute syntax {:.class} not generic {content}
const MARKDOWN_EXTENDED_ATTR = /\{:[^}]+\}/g;

const TURNDOWN_OPTIONS: ConstructorParameters<typeof TurndownService>[0] = {
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
};

export function convertHtmlToMarkdown(html: string): { title: string; markdown: string } {
  const $ = cheerio.load(html);

  // Extract title before cleanup
  const title = $('title').first().text().trim();

  // Remove unwanted elements
  REMOVABLE_TAGS.forEach(tag => $(tag).remove());
  $('[aria-hidden="true"]').remove();
  $(REMOVABLE_CLASSES).remove();
  $('img[src^="data:"]').remove();
  $('sup').remove();
  $('a[href*="/edit/"]').remove();

  // Extract main content
  let contentHtml = '';
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length && el.text().trim()) {
      contentHtml = el.html() ?? '';
      break;
    }
  }
  if (!contentHtml) {
    contentHtml = $('body').html() ?? $.html();
  }

  // Create per-call instance to avoid shared state mutation
  const turndown = new TurndownService(TURNDOWN_OPTIONS);
  const markdown = turndown.turndown(contentHtml);
  const processed = postProcess(markdown);

  return { title, markdown: processed };
}

function postProcess(markdown: string): string {
  return markdown
    .replace(BASE64_IMAGE, '')
    .replace(EMPTY_IMAGE, '')
    .replace(MARKDOWN_EXTENDED_ATTR, '')
    .replace(TRAILING_WHITESPACE, '\n')
    .replace(CONSECUTIVE_BLANK_LINES, '\n\n')
    .trim();
}
