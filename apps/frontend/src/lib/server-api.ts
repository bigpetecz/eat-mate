'use server';

import { cookies } from 'next/headers';

/**
 * Best practice for Next.js: Server Functions for authenticated API calls
 * Use these in Server Components to fetch data with automatic JWT authentication
 *
 * Example usage in a Server Component:
 * ```
 * import { getAuthenticatedUser, fetchWithAuth } from '@/lib/server-api';
 *
 * export default async function MyPage() {
 *   const user = await getAuthenticatedUser();
 *   const data = await fetchWithAuth('/api/endpoint', { method: 'GET' });
 * }
 * ```
 */

interface FetchOptions extends RequestInit {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * Generic server-side authenticated fetch function
 */
export async function fetchWithAuth<T = Record<string, unknown>>(
  endpoint: string,
  options: FetchOptions = { method: 'GET' }
): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    const url = new URL(
      endpoint.startsWith('http')
        ? endpoint
        : `${process.env.NEXT_API_URL}${endpoint}`
    );

    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers,
    });

    if (!response.ok) {
      console.warn(`API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`fetchWithAuth failed for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Get authenticated user - commonly needed in Server Components
 */
export async function getAuthenticatedUser() {
  return fetchWithAuth('/auth/me', { method: 'GET' });
}
