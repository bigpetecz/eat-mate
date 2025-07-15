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
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);
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

  useEffect(() => {
    async function fetchFavorite() {
      try {
        const res = await apiClient.get('/users/favorites');
        setIsFavorite(res.data.favorites.includes(recipeId));
      } catch {
        setIsFavorite(false);
      }
    }
    fetchFavorite();
  }, [recipeId]);

  const handleToggleFavorite = async () => {
    setLoadingFavorite(true);
    try {
      if (isFavorite) {
        await apiClient.delete(`/users/favorites/${recipeId}`);
        setIsFavorite(false);
      } else {
        await apiClient.post('/users/favorites', { recipeId });
        setIsFavorite(true);
      }
    } catch (err) {
      // Optionally show error
    } finally {
      setLoadingFavorite(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="icon"
            aria-label={
              isFavorite ? 'Remove from favorites' : 'Add to favorites'
            }
            onClick={handleToggleFavorite}
            disabled={loadingFavorite}
          >
            <Heart
              className={`w-5 h-5 ${
                isFavorite ? 'text-pink-500 fill-pink-500' : ''
              }`}
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </TooltipContent>
      </Tooltip>
      <Tooltip open={copied}>
        <TooltipTrigger asChild>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="icon"
            aria-label="Share recipe - copy link"
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
