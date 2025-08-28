import { cookies } from 'next/headers';

export async function getUser() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('token')?.value;

  try {
    const response = await fetch(`${process.env.NEXT_API_URL}/auth/me`, {
      headers: {
        Cookie: `token=${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }
    const user = await response.json();

    return user;
  } catch (fetchErr) {
    console.error('Failed to fetch user from /api/auth/me', fetchErr);
    return null;
  }
}
