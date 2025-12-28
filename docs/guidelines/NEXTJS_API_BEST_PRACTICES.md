# Next.js Best Practices for API Calls - Authentication Guide

## The Problem

In Next.js 13+, you cannot use the same HTTP client for both **Server Components** and **Client Components** when that client imports from Next.js server-only modules like `cookies()`.

### ❌ What Was Wrong

```typescript
// ❌ BAD: api-client.ts trying to import `cookies()`
import { cookies } from 'next/headers'; // This is server-only!
import axios from 'axios';

export const apiClient = axios.create({...});

// Then using it in BOTH server AND client components
// This causes: "You're importing a component that needs "next/headers"
// That only works in a Server Component but one of its parents is
// marked with "use client""
```

## The Solution: Separate Utilities by Context

### 1. **Client-Side: `/app/api-client.ts`** (For Client Components)

Use this in components with `'use client'` directive:

```typescript
// ✅ GOOD: Pure client-side HTTP client
import axios from 'axios';

const baseURL = '/api';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // Automatically sends cookies
  headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
```

**Usage in Client Components:**

```typescript
'use client';
import { apiClient } from '@/app/api-client';

export default function MyComponent() {
  useEffect(() => {
    apiClient.get('/recipes').then((res) => {
      setRecipes(res.data);
    });
  }, []);

  return <div>Recipes</div>;
}
```

### 2. **Server-Side: `/lib/server-api.ts`** (For Server Components & Server Actions)

Use this in Server Components or Server Actions:

```typescript
'use server';

import { cookies } from 'next/headers';

export async function fetchWithAuth<T = Record<string, unknown>>(endpoint: string, options: RequestInit = { method: 'GET' }): Promise<T | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${process.env.NEXT_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) return null;
  return await response.json();
}

export async function getAuthenticatedUser() {
  return fetchWithAuth('/auth/me', { method: 'GET' });
}
```

**Usage in Server Components:**

```typescript
// ✅ GOOD: Server Component using server utilities
import { getAuthenticatedUser } from '@/lib/server-api';

export default async function MyPage() {
  const user = await getAuthenticatedUser();

  return <div>Welcome, {user?.displayName}</div>;
}
```

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                 Next.js App                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Server Components          Client Components   │
│  (No 'use client')          ('use client')       │
│        │                           │             │
│        ├─► /lib/server-api.ts     ├─► /app/api-client.ts
│        │   • cookies()             │   • axios
│        │   • fetch() + Bearer      │   • withCredentials
│        │   • automatic auth        │   • manual listeners
│        │                           │
│        └─────────────────────────────────────────
│                    │
│                    ▼
│            Backend API (/api)
│            • JWT in Authorization header
│            • JWT in cookies
│            • CORS with credentials: true
│
└─────────────────────────────────────────────────┘
```

## Migration Pattern

### Before (❌ Broken)

```typescript
// page.tsx (Server Component)
const user = await apiClient.get('/auth/me'); // ❌ ERROR!
```

### After (✅ Correct)

```typescript
// page.tsx (Server Component)
import { getAuthenticatedUser } from '@/lib/server-api';

const user = await getAuthenticatedUser(); // ✅ Works!
```

## Key Rules

| Context                                | Use                     | Reason                                      |
| -------------------------------------- | ----------------------- | ------------------------------------------- |
| **Client Components** (`'use client'`) | `apiClient`             | Axios automatically includes credentials    |
| **Server Components**                  | `fetchWithAuth()`       | Access to `cookies()` for JWT token         |
| **Server Actions**                     | `fetchWithAuth()`       | Access to `cookies()` for JWT token         |
| **API Routes** (`/api/*.ts`)           | `node-fetch` or `fetch` | Direct backend access, add headers manually |

## Authentication Flow

### Client-Side Request Flow

```
Browser Component
    ↓
apiClient.get('/recipes')
    ↓
axios (withCredentials: true)
    ↓
Automatically includes cookies
    ↓
Backend sees Cookie header
    ↓
JWT extracted from cookies
    ↓
✅ Authenticated
```

### Server-Side Request Flow

```
Server Component
    ↓
getAuthenticatedUser()
    ↓
fetchWithAuth('/auth/me')
    ↓
Read token from cookies()
    ↓
Add Authorization: Bearer {token} header
    ↓
fetch() with headers
    ↓
Backend sees Authorization header
    ↓
JWT extracted from header
    ↓
✅ Authenticated
```

## Common Patterns

### Get User in Server Component

```typescript
import { getAuthenticatedUser } from '@/lib/server-api';

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  return <Settings user={user} />;
}
```

### Generic API Call in Server Component

```typescript
import { fetchWithAuth } from '@/lib/server-api';

export default async function RecipePage() {
  const recipe = await fetchWithAuth('/recipes/123', { method: 'GET' });
  return <Recipe data={recipe} />;
}
```

### API Call in Client Component

```typescript
'use client';
import { apiClient } from '@/app/api-client';

export default function CreateRecipe() {
  const handleSubmit = async (data) => {
    const response = await apiClient.post('/recipes', data);
    // Works automatically with credentials!
  };
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Server Action with API Call

```typescript
'use server';
import { fetchWithAuth } from '@/lib/server-api';

export async function updateUserAction(data: UserData) {
  return await fetchWithAuth('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
```

## Summary

✅ **Do This:**

- Server Components → `fetchWithAuth()` or `getAuthenticatedUser()`
- Client Components → `apiClient` (Axios)
- Keep utilities separated by execution context

❌ **Don't Do This:**

- Import `cookies()` in client-side utilities
- Use Axios with `cookies()` in server utilities
- Mix server/client logic in one utility file

This follows Next.js 13+ best practices and avoids runtime errors!
