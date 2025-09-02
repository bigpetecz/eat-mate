import { Suspense } from 'react';
import { DiscoverInner } from './components/DiscoverInner';
import { Spinner } from '@/components/ui/spinner';
import { getDictionary } from '../../../dictionaries/dictionaries';
import { Locale } from '@/i18n';

interface DiscoverPageProps {
  params: { language: Locale };
}

export default async function DiscoverPage({ params }: DiscoverPageProps) {
  const locale = params;

  const dictionary = await getDictionary(locale.language, 'discover');

  return (
    <Suspense fallback={<Spinner />}>
      <DiscoverInner dictionary={dictionary.DiscoverPage} />
    </Suspense>
  );
}
