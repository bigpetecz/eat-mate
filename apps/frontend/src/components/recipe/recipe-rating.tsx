'use client';
import { useEffect, useState } from 'react';
import { Rating, RatingButton } from '@/components/ui/rating';
import { StarIcon } from 'lucide-react';
import { User } from '@/app/auth/authStore';
import { apiClient } from '@/app/api-client';

export function RecipeRating({
  recipeId,
  authorId,
  averageRating,
  ratingCount,
}: {
  recipeId: string;
  authorId: string;
  averageRating: number;
  ratingCount: number;
}) {
  const [userRating, setUserRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [localAverage, setLocalAverage] = useState<number>(averageRating);
  const [localCount, setLocalCount] = useState<number>(ratingCount);
  const [displayRating, setDisplayRating] = useState(false);

  const handleRate = async (_event: any, value: number) => {
    setSubmitting(true);
    setUserRating(value);
    try {
      const res = await apiClient.post(`/recipes/${recipeId}/rate`, { value });
      setLocalAverage(res.data.averageRating);
      setLocalCount(res.data.ratingCount);
    } catch (err) {
      // Optionally show error
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await apiClient.get<User>('/auth/me');
        setDisplayRating(res.data._id !== authorId);
      } catch {
        setDisplayRating(false);
      }
    }
    fetchMe();
  }, [authorId]);

  return (
    <div className="flex items-center gap-2 mt-2">
      <StarIcon className="text-yellow-400 fill-yellow-400 w-5 h-5" />
      <span className="font-semibold text-lg">{localAverage.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">({localCount})</span>
      {displayRating && (
        <Rating
          className="text-yellow-400 fill-yellow-400 ml-2"
          value={userRating || Math.round(localAverage)}
          defaultValue={3}
          readOnly={submitting}
          onChange={handleRate}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <RatingButton key={index} />
          ))}
        </Rating>
      )}
    </div>
  );
}
