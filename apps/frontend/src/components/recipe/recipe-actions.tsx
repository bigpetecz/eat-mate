'use client';
import { Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FC, useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { User } from '@/app/auth/authStore';
import { getLocalizedRoute, Locale } from '@/i18n';
import { Recipe } from '@/types/recipe';
import Link from 'next/link';
import { apiClient } from '@/app/api-client';
interface RecipeActionsProps {
  authorId: string;
  recipe: Recipe;
  actionsDict: {
    addToFavorites: string;
    removeFromFavorites: string;
    shareRecipe: string;
    linkCopied: string;
    edit: string;
  };
  language: string;
  user: User | null;
}

export const RecipeActions: FC<RecipeActionsProps> = ({
  authorId,
  recipe,
  actionsDict,
  language,
  user,
}) => {
  const [copied, setCopied] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  const recipeId = recipe._id;
  useEffect(() => {
    async function fetchFavorite() {
      try {
        const res = await apiClient.get(`/users/${language}/favorites`);
        setIsFavorite(res.data.favorites.includes(recipeId));
      } catch {
        setIsFavorite(false);
      }
    }
    fetchFavorite();
  }, [recipeId]);

  useEffect(() => {
    if (user && authorId) {
      setIsAuthor(user?._id === authorId);
    } else {
      setIsAuthor(false);
    }
  }, [user, authorId]);

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
    } catch {
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
              isFavorite
                ? actionsDict.removeFromFavorites
                : actionsDict.addToFavorites
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
          {isFavorite
            ? actionsDict.removeFromFavorites
            : actionsDict.addToFavorites}
        </TooltipContent>
      </Tooltip>
      <Tooltip open={copied}>
        <TooltipTrigger asChild>
          <Button
            className="cursor-pointer"
            variant="outline"
            size="icon"
            aria-label={actionsDict.shareRecipe}
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{actionsDict.linkCopied}</TooltipContent>
      </Tooltip>
      {isAuthor && (
        <Link
          href={getLocalizedRoute(
            'recipeEdit',
            language as Locale,
            recipe.slug
          )}
        >
          <Button className="cursor-pointer ml-2" variant="default">
            {actionsDict.edit}
          </Button>
        </Link>
      )}
    </div>
  );
};
