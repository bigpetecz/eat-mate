import { redirect } from 'next/navigation';

interface AuthCallbackPageProps {
  searchParams: Promise<{ state?: string }>;
}

export default async function AuthCallbackPage({
  searchParams,
}: AuthCallbackPageProps) {
  const { state } = await searchParams;
  const safeState = state && state.startsWith('/') ? state : '/';
  redirect(safeState);
}
