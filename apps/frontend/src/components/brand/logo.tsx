import { CookingPot } from 'lucide-react';
import { FC } from 'react';

export const Logo: FC = () => {
  return (
    <div className="flex items-center gap-2 self-center font-medium">
      <div className="bg-primary text-primary-foreground flex size-5 md:size-6 items-center justify-center rounded-md">
        <CookingPot className="size-3 md:size-4" />
      </div>
      <div className="text-sm md:text-2xl font-bold">Eat Mate</div>
    </div>
  );
};
