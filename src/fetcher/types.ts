export interface HtmlFetcher {
  fetch(url: string): Promise<string>;
}
