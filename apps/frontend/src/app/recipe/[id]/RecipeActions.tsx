'use client';
import { Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

export function RecipeActions() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex gap-2">
      <Button
        className="cursor-pointer"
        variant="outline"
        size="icon"
        aria-label="Add to favorites"
        onClick={() => {
          // TODO: implement favorite logic
        }}
      >
        <Heart className="w-5 h-5" />
      </Button>
      <Tooltip open={copied}>
        <TooltipTrigger asChild>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="icon"
            aria-label="Share recipe"
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Link copied!</TooltipContent>
      </Tooltip>
    </div>
  );
}
