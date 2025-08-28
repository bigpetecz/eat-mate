import { FC } from 'react';

interface HeadlineProps {
  dict: Record<string, string>;
}

export const Headline: FC<HeadlineProps> = ({ dict }) => (
  <div className="max-w-5xl mx-auto px-2 md:px-0">
    <p className="text-center text-muted-foreground">{dict.headline}</p>
  </div>
);
