import { describe, it, expect } from 'vitest';
import { InvalidUrlError, FetchFailedError } from '../../utils/errors.js';

describe('InvalidUrlError', () => {
  it('should have correct name', () => {
    const err = new InvalidUrlError('ftp://bad');
    expect(err.name).toBe('InvalidUrlError');
  });

  it('should include URL in message', () => {
    const err = new InvalidUrlError('http://127.0.0.1');
    expect(err.message).toContain('http://127.0.0.1');
  });

  it('should be instance of Error', () => {
    expect(new InvalidUrlError('x')).toBeInstanceOf(Error);
  });

  it('should mention protocol restriction in message', () => {
    const err = new InvalidUrlError('ftp://example.com');
    expect(err.message).toMatch(/http|https/i);
  });
});

describe('FetchFailedError', () => {
  it('should have correct name', () => {
    const err = new FetchFailedError('https://example.com', new Error('timeout'));
    expect(err.name).toBe('FetchFailedError');
  });

  it('should include URL in message', () => {
    const err = new FetchFailedError('https://example.com', new Error('timeout'));
    expect(err.message).toContain('https://example.com');
  });

  it('should include cause message', () => {
    const err = new FetchFailedError('https://example.com', new Error('Connection refused'));
    expect(err.message).toContain('Connection refused');
  });

  it('should handle non-Error cause', () => {
    const err = new FetchFailedError('https://example.com', 'string error');
    expect(err.message).toContain('string error');
  });

  it('should be instance of Error', () => {
    expect(new FetchFailedError('x', new Error())).toBeInstanceOf(Error);
  });
});
