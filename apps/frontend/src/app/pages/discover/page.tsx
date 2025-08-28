import { Suspense } from 'react';
import { DiscoverInner } from './components/DiscoverInner';
import { Spinner } from '@/components/ui/spinner';
import { getDictionary } from '../../../dictionaries/dictionaries';
import { Locale } from '@/i18n';

interface DiscoverPageProps {
  params: Promise<{ language: Locale }>;
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  const locale = await params;

  const dictionary = await getDictionary(locale.language, 'discover');

  return (
    <Suspense fallback={<Spinner />}>
      <DiscoverInner dictionary={dictionary.DiscoverPage} />
    </Suspense>
  );
}
