import { CookingPot } from 'lucide-react';
import { FC } from 'react';

interface LogoProps {
  className?: string;
  small?: boolean;
}

export const Logo: FC<LogoProps> = ({ className = '', small = false }) => {
  return (
    <div
      className={`flex items-center gap-2 self-center font-medium ${className}`}
    >
      <div
        className={
          small
            ? 'bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-md'
            : 'bg-primary text-primary-foreground flex size-5 md:size-6 items-center justify-center rounded-md'
        }
      >
        <CookingPot className={small ? 'size-3' : 'size-3 md:size-4'} />
      </div>
      <div
        className={
          small ? 'text-base font-bold' : 'text-sm md:text-2xl font-bold'
        }
      >
        Eat Mate
      </div>
    </div>
  );
};
