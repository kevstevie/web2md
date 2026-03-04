import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

type CheerioAPI = ReturnType<typeof cheerio.load>;

const REMOVABLE_TAGS = [
  'script', 'style', 'nav', 'footer', 'header',
  'form', 'iframe', 'noscript', 'svg', 'button',
];
const SEMANTIC_SELECTORS = ['main', 'article', '[role="main"]'];
const REMOVABLE_CLASSES = '.ad, .ads, .advertisement, .sidebar, .popup, .modal, .cookie-banner';

const CONSECUTIVE_BLANK_LINES = /\n{3,}/g;
const TRAILING_WHITESPACE = /[ \t]+\n/g;
const BASE64_IMAGE = /!\[[^\]]*\]\(data:[^)]*\)/g;
const EMPTY_IMAGE = /!\[\]\([^)]*\)/g;
// Only strip known Markdown extended attribute syntax {:.class} not generic {content}
const MARKDOWN_EXTENDED_ATTR = /\{:[^}]+\}/g;

// Minimum text length for a candidate to be considered main content
const MIN_TEXT_LENGTH = 150;
// Weight applied to link density penalty (0 = no penalty, 1 = full penalty)
const LINK_DENSITY_WEIGHT = 0.5;

// Module-level singleton: TurndownService is stateless after construction
// (no addRule calls), so it's safe to share across calls.
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
});

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

  const contentHtml = extractMainContent($);
  const markdown = turndown.turndown(contentHtml);
  const processed = postProcess(markdown);

  return { title, markdown: processed };
}

function extractMainContent($: CheerioAPI): string {
  // 1. Semantic selectors fast path (well-structured sites)
  //    Trust these tags unconditionally — no length threshold needed.
  for (const selector of SEMANTIC_SELECTORS) {
    const el = $(selector).first();
    if (el.length && el.text().trim()) {
      return el.html() ?? '';
    }
  }

  // 2. Text density based extraction for SPAs / sites without semantic structure
  //
  // Score = textLen × textDensity × (1 - linkDensity × weight)
  //   - textLen × textDensity ≈ effective readable chars (how much of the HTML is real text)
  //   - linkDensity penalty: deprioritise navigation-heavy blocks
  //   Using textLen as the multiplier (not log) ensures a longer content block always
  //   beats a shorter one of equal density, which fixes SPA sites like namu.wiki where
  //   small isolated paragraphs would otherwise outscore the full article container.
  let bestScore = 0;
  let bestHtml = '';

  $('div, section, article').each((_, el) => {
    const $el = $(el);
    const textLen = $el.text().trim().length;
    if (textLen < MIN_TEXT_LENGTH) return;

    const htmlLen = ($el.html() ?? '').length;
    if (htmlLen === 0) return;

    const density = textLen / htmlLen;
    const linkTextLen = $el.find('a').text().trim().length;
    const linkDensity = textLen > 0 ? linkTextLen / textLen : 1;

    const score = textLen * density * (1 - linkDensity * LINK_DENSITY_WEIGHT);

    if (score > bestScore) {
      bestScore = score;
      bestHtml = $el.html() ?? '';
    }
  });

  if (bestHtml) return bestHtml;

  // 3. Ultimate fallback
  return $('body').html() ?? $.html();
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
