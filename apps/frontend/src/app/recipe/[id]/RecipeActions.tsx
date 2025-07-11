'use client';
import { Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import apiClient from '../../apiClient';

export function RecipeActions({
  authorId,
  recipeId,
}: {
  authorId: string;
  recipeId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await apiClient.get('/auth/me');
        const user = res.data;
        setIsAuthor(user?._id === authorId);
      } catch {
        setIsAuthor(false);
      }
    }
    fetchMe();
  }, [authorId]);

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
      {isAuthor && (
        <Button
          className="cursor-pointer ml-2"
          variant="default"
          onClick={() => router.push(`/recipe/edit/${recipeId}`)}
        >
          Edit
        </Button>
      )}
    </div>
  );
}
