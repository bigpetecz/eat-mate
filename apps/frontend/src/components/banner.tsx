'use client';

import { Button } from '@/components/ui/button';
import { getLocalizedRoute, Locale } from '@/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Utensils, EggFried } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function Banner({
  dictionary,
}: {
  dictionary?: Record<string, string>;
}) {
  const [index, setIndex] = useState(0);
  const { language = 'en' } = useParams();
  const slogans = [
    dictionary?.heroSlogan1,
    dictionary?.heroSlogan2,
    dictionary?.heroSlogan3,
  ];
  const descriptions = [
    dictionary?.heroSloganDescription1,
    dictionary?.heroSloganDescription2,
    dictionary?.heroSloganDescription3,
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slogans.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full md:min-h-[40vh] flex flex-col md:justify-center items-center bg-gradient-to-bl from-yellow-50 via-orange-100 to-orange-200 dark:from-orange-950 dark:via-orange-900 dark:to-yellow-900 overflow-hidden">
      {/* Animated icons for desktop with color */}
      <div className="hidden md:block absolute left-8 top-8 z-10 opacity-80">
        <motion.div
          initial={{ rotate: -10, y: 0 }}
          animate={{ rotate: [0, 10, -10, 0], y: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
        >
          <ChefHat
            size={60}
            className="text-orange-400 dark:text-yellow-300 drop-shadow-lg"
          />
        </motion.div>
      </div>
      <div className="hidden md:block absolute right-8 top-16 z-10 opacity-80">
        <motion.div
          initial={{ rotate: 10, y: 0 }}
          animate={{ rotate: [0, -10, 10, 0], y: [0, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 7 }}
        >
          <Utensils
            size={60}
            className="text-orange-500 dark:text-yellow-200 drop-shadow-lg"
          />
        </motion.div>
      </div>
      <div className="hidden md:block absolute left-1/2 bottom-8 -translate-x-1/2 z-10 opacity-80">
        <motion.div
          initial={{ rotate: 0, y: 0 }}
          animate={{ rotate: [0, 10, -10, 0], y: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
        >
          <EggFried
            size={50}
            className="text-yellow-500 dark:text-orange-200 drop-shadow-lg"
          />
        </motion.div>
      </div>
      {/* Main content: slogans/descriptions and buttons */}
      <div className="relative w-full max-w-3xl flex flex-1 flex-col justify-between items-center px-4 md:px-0 py-8 md:py-16 z-20 min-h-[60vh]">
        <div className="flex-1 flex flex-col items-center justify-center pt-16 md:pt-0 w-full">
          <AnimatePresence mode="wait">
            <motion.h1
              key={`slogan-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8 }}
              className="mb-2 text-4xl font-bold text-orange-900 md:text-6xl dark:text-yellow-100 text-center w-full"
              style={{ minHeight: 'clamp(2.5rem, 8vw, 4.5rem)' }}
            >
              {slogans[index]}
            </motion.h1>
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={`desc-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="mb-6 text-lg text-orange-800 md:text-xl dark:text-yellow-200 text-center w-full"
              style={{ minHeight: 'clamp(1.5rem, 6vw, 3.5rem)' }}
            >
              {descriptions[index]}
            </motion.p>
          </AnimatePresence>
        </div>
        {/* Buttons: always at bottom on mobile, centered on desktop */}
        <div className="w-full max-w-xl mx-auto flex flex-col md:flex-row gap-3 justify-center items-center mt-2 md:mt-0 pb-4">
          <Link href={getLocalizedRoute('signUp', language as Locale)}>
            <Button
              size="lg"
              variant="default"
              className="cursor-pointer dark:bg-orange-700 dark:text-yellow-100 dark:hover:bg-orange-800"
            >
              {dictionary?.signUpAndShare}
            </Button>
          </Link>
          <Link href={getLocalizedRoute('discover', language as Locale, {})}>
            <Button
              size="lg"
              variant="outline"
              className="cursor-pointer dark:border-yellow-200 dark:text-yellow-200 dark:hover:bg-orange-900/30"
            >
              {dictionary?.discoverRecipes}
            </Button>
          </Link>
        </div>
      </div>
      {/* Animated icons for mobile (hidden on desktop): EggFried top center, ChefHat and Utensils bottom corners */}
      {/* Top center EggFried */}
      <div className="md:hidden absolute left-1/2 top-4 -translate-x-1/2 z-10 opacity-90 pointer-events-none">
        <motion.div
          initial={{ rotate: 0, y: 0 }}
          animate={{ rotate: [0, 10, -10, 0], y: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
        >
          <EggFried
            size={28}
            className="text-yellow-500 dark:text-orange-200 drop-shadow-md"
          />
        </motion.div>
      </div>
      {/* Bottom left ChefHat */}
      <div className="md:hidden absolute left-4 bottom-4 z-10 opacity-90 pointer-events-none">
        <motion.div
          initial={{ rotate: -10, y: 0 }}
          animate={{ rotate: [0, 10, -10, 0], y: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
        >
          <ChefHat
            size={32}
            className="text-orange-400 dark:text-yellow-300 drop-shadow-md"
          />
        </motion.div>
      </div>
      {/* Bottom right Utensils */}
      <div className="md:hidden absolute right-4 bottom-4 z-10 opacity-90 pointer-events-none">
        <motion.div
          initial={{ rotate: 10, y: 0 }}
          animate={{ rotate: [0, -10, 10, 0], y: [0, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 7 }}
        >
          <Utensils
            size={32}
            className="text-orange-500 dark:text-yellow-200 drop-shadow-md"
          />
        </motion.div>
      </div>
    </section>
  );
}
