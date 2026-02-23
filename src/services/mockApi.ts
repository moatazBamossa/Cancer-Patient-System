// ============================================================
// Mock API Layer — Simulates async API calls from data.json
// ============================================================

import rawData from '../data/data.json';
import type { MockData, PaginatedResponse, PaginationParams } from '../types';

// Type assertion for the raw JSON
const data: MockData = rawData as unknown as MockData;

// Simulated network delay range (ms)
const MIN_DELAY = 200;
const MAX_DELAY = 600;

function randomDelay(): number {
  return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
}

/**
 * Wraps any data access in a simulated async call.
 */
export async function simulateApiCall<T>(resolver: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const result = resolver();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, randomDelay());
  });
}

/**
 * Generic paginated fetch with search, sort, and filter support.
 */
export function paginateData<T extends Record<string, unknown>>(
  items: T[],
  params: PaginationParams,
  searchFields?: (keyof T)[]
): PaginatedResponse<T> {
  let filtered = [...items];

  // Search
  if (params.search && searchFields && searchFields.length > 0) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter((item) =>
      searchFields.some((field) =>
        String(item[field] ?? '')
          .toLowerCase()
          .includes(q)
      )
    );
  }

  // Sort
  if (params.sortBy) {
    const sortKey = params.sortBy as keyof T;
    const dir = params.sortOrder === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / params.pageSize);
  const start = (params.page - 1) * params.pageSize;
  const paged = filtered.slice(start, start + params.pageSize);

  return {
    data: paged,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages,
  };
}

/**
 * Access the underlying in-memory data store.
 * This is used by services to read/write (in-session) data.
 */
export function getDataStore(): MockData {
  return data;
}
