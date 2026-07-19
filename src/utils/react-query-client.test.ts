import { describe, it, expect } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { client } from './react-query-client';

describe('react-query client', () => {
  it('is a configured QueryClient instance', () => {
    expect(client).toBeInstanceOf(QueryClient);
  });

  it('does not refetch queries on window focus', () => {
    expect(client.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });

  it('retries failed queries three times', () => {
    expect(client.getDefaultOptions().queries?.retry).toBe(3);
  });

  it('does not retry failed mutations', () => {
    expect(client.getDefaultOptions().mutations?.retry).toBe(0);
  });
});
