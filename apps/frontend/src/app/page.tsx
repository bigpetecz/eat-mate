'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import apiClient from './apiClient';
import { Spinner } from '@/components/ui/spinner';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Banner from '@/components/banner';
import Link from 'next/link';

export default function HomePage() {
  const [recipes, setRecipes] = useState<any[]>([]); // TODO: Replace any with Recipe type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<{ search: string }>();

  const onSubmit = (data: { search: string }) => {
    if (data.search && data.search.trim()) {
      router.push(`/discover?search=${encodeURIComponent(data.search.trim())}`);
      reset();
    }
  };

  useEffect(() => {
    apiClient
      .get('/recipes')
      .then((res) => setRecipes(res.data))
      .catch((err) => setError('Failed to load recipes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col bg-muted">
      <div className="px-2 sm:px-4 md:px-0">
        {/* HERO */}
        <section className="relative flex flex-col items-center justify-center text-center py-16 bg-muted">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Your Next Favorite Recipe
          </h1>
          <p className="text-lg mb-8">
            Cook smarter, discover better, enjoy more.
          </p>

          {/* Carousel */}
          <div className="w-full max-w-5xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center min-h-[20rem]">
                <Spinner />
              </div>
            ) : error ? (
              <div className="text-destructive py-12">{error}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recipes.slice(0, 3).map((recipe) => (
                  <RecipeCard key={recipe._id} recipe={recipe} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      {/* SEARCH */}
      <section className="bg-background flex flex-col items-center justify-center py-16 px-2 sm:px-4 md:px-0">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full max-w-xl gap-2"
        >
          <Input
            placeholder="What do you want to cook?"
            className="flex-1 h-14 text-lg px-6"
            {...register('search')}
          />
          <Button
            type="submit"
            variant="default"
            className="h-14 text-lg cursor-pointer px-4 flex items-center gap-2"
          >
            <SearchIcon className="h-6 w-6" />
            <span>Search</span>
          </Button>
        </form>

        {/* Popular tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {/* Example clickable badges for homepage popular tags */}
          <Link href="/discover?cookTimeMax=30">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              30 Min Meals
            </Badge>
          </Link>
          <Link href="/discover?diets=vegan">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              Vegan
            </Badge>
          </Link>
          <Link href="/discover?estimatedCostMax=1.5">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              Budget-Friendly
            </Badge>
          </Link>
          <Link href="/discover?specialAttributes=one-pot">
            <Badge variant="outline" className="cursor-pointer hover:bg-accent">
              One-Pot
            </Badge>
          </Link>
        </div>
      </section>
      <Banner />
    </div>
  );
}
