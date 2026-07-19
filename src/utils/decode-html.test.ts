import { describe, it, expect } from 'vitest';
import { decodeHtml } from './decode-html';

describe('decodeHtml', () => {
  it('decodes named HTML entities', () => {
    expect(decodeHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
  });

  it('decodes quotes and angle brackets', () => {
    expect(decodeHtml('&lt;b&gt;bold&lt;/b&gt;')).toBe('<b>bold</b>');
    expect(decodeHtml('She said &quot;hi&quot;')).toBe('She said "hi"');
  });

  it('decodes numeric entities', () => {
    expect(decodeHtml('caf&#233;')).toBe('café');
  });

  it('leaves plain text unchanged', () => {
    expect(decodeHtml('just a normal message')).toBe('just a normal message');
  });

  it('returns an empty string for empty input', () => {
    expect(decodeHtml('')).toBe('');
  });
});
