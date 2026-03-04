export class InvalidUrlError extends Error {
  constructor(url: string) {
    super(`Invalid URL: '${url}'. Only http and https protocols are supported.`);
    this.name = 'InvalidUrlError';
  }
}

export class FetchFailedError extends Error {
  constructor(url: string, causeError: unknown) {
    const reason = causeError instanceof Error ? causeError.message : String(causeError);
    super(`Failed to fetch URL: '${url}'. Reason: ${reason}`);
    this.name = 'FetchFailedError';
  }
}
