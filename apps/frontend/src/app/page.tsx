'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import apiClient from './apiClient';
import Link from 'next/link';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';

export default function HomePage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/recipes')
      .then((res) => setRecipes(res.data))
      .catch((err) => setError('Failed to load recipes'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative flex flex-col items-center justify-center text-center py-16 bg-muted">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Discover Your Next Favorite Recipe
        </h1>
        <p className="text-lg mb-8">Cook smarter, filter better, enjoy more.</p>

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
                <Link
                  href={`/recipe/${recipe._id}`}
                  key={recipe._id}
                  className="contents"
                >
                  <Card className="pt-0">
                    <CardContent className="p-0">
                      {recipe.images?.[0] ? (
                        <Image
                          src={recipe.images[0]}
                          alt={recipe.title}
                          width={600}
                          height={256}
                          className="w-full h-64 object-cover rounded-t-lg"
                          priority={true}
                        />
                      ) : (
                        <div className="rounded-lg w-full md:w-80 h-64 object-cover mb-4 md:mb-0 bg-background flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                      <div className="p-4 pb-0">
                        <h3 className="text-xl font-semibold">
                          {recipe.title}
                        </h3>
                        <p className="text-muted-foreground mt-2 line-clamp-2">
                          {recipe.description}
                        </p>
                        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <svg
                              width="18"
                              height="18"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="inline-block"
                            >
                              <circle cx="9" cy="9" r="8" />
                              <path d="M9 4v5l3 3" />
                            </svg>
                            {recipe.cookTime || '--'} min
                          </span>
                          <span className="flex items-center gap-1">
                            <svg
                              width="18"
                              height="18"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              className="inline-block"
                            >
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 3.87 3.13 7 7 7s7-3.13 7-7c0-3.87-3.13-7-7-7zm0 12c-2.76 0-5-2.24-5-5 0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.76-2.24 5-5 5z" />
                              <circle cx="12" cy="9" r="2.5" />
                            </svg>
                            {recipe.calories || '--'} kcal
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SEARCH */}
      <section className="flex flex-col items-center justify-center py-16">
        <div className="flex w-full max-w-xl gap-2">
          <Input
            placeholder="What do you want to cook today?"
            className="flex-1"
          />
          <Button variant="default">
            <SearchIcon className="h-5 w-5 mr-2" /> Search
          </Button>
        </div>

        {/* Popular tags */}
        <div className="flex flex-wrap gap-2 mt-6">
          {['30 Min Meals', 'Vegan', 'Budget-Friendly', 'One-Pot'].map(
            (tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            )
          )}
        </div>
      </section>
    </div>
  );
}
