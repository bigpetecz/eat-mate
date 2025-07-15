'use client';

import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Utensils, EggFried } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const slogans = [
  'Inspire others with your cooking.',
  'Plan your meals with confidence.',
  'Eat smarter, together.',
];

const descriptions = [
  'Motivate other home cooks with your delicious creations.',
  'Create meal lists for your day or week and stay on track.',
  'Join a cozy food community and eat well within your budget.',
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slogans.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex h-[40vh] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-orange-200 via-orange-300 to-yellow-100 text-center dark:bg-gradient-to-br dark:from-orange-900 dark:via-orange-950 dark:to-yellow-900">
      <div className="max-w-[1024px] flex flex-col items-center px-4">
        {/* Animated decorative cooking icons */}
        <motion.div
          className="absolute left-10 top-10 text-orange-500 dark:text-orange-300"
          animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
        >
          <ChefHat size={50} />
        </motion.div>

        <motion.div
          className="absolute right-10 top-20 text-orange-400 dark:text-orange-200"
          animate={{ y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 5 }}
        >
          <Utensils size={45} />
        </motion.div>

        <motion.div
          className="absolute left-1/2 bottom-10 text-orange-300 dark:text-yellow-200"
          animate={{ y: [0, -15, 0] }}
          transition={{ repeat: Infinity, duration: 7 }}
        >
          <EggFried size={50} />
        </motion.div>

        {/* Slogan text */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={`slogan-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
            className="mb-2 text-4xl font-bold text-orange-900 md:text-6xl dark:text-yellow-100"
          >
            {slogans[index]}
          </motion.h1>
        </AnimatePresence>

        {/* Description text */}
        <AnimatePresence mode="wait">
          <motion.p
            key={`desc-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8 }}
            className="mb-6 max-w-xl text-lg text-orange-800 md:text-xl dark:text-yellow-200"
          >
            {descriptions[index]}
          </motion.p>
        </AnimatePresence>

        <div className="flex flex-col items-center gap-3 md:flex-row">
          <Link href={'/sign-up'}>
            <Button
              size="lg"
              variant="default"
              className="cursor-pointer dark:bg-orange-700 dark:text-yellow-100 dark:hover:bg-orange-800"
            >
              Sign Up & Share
            </Button>
          </Link>
          <Link href={'/discover'}>
            <Button
              size="lg"
              variant="outline"
              className="cursor-pointer dark:border-yellow-200 dark:text-yellow-200 dark:hover:bg-orange-900/30"
            >
              Discover Recipes
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
