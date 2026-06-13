'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PlusIcon } from 'lucide-react';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { getLocalizedRoute, Locale } from '@/i18n';

// const components: { title: string; href: string; description: string }[] = [
//   {
//     title: 'Alert Dialog',
//     href: '/docs/primitives/alert-dialog',
//     description:
//       'A modal dialog that interrupts the user with important content and expects a response.',
//   },
//   {
//     title: 'Hover Card',
//     href: '/docs/primitives/hover-card',
//     description:
//       'For sighted users to preview content available behind a link.',
//   },
//   {
//     title: 'Progress',
//     href: '/docs/primitives/progress',
//     description:
//       'Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.',
//   },
//   {
//     title: 'Scroll-area',
//     href: '/docs/primitives/scroll-area',
//     description: 'Visually or semantically separates content.',
//   },
//   {
//     title: 'Tabs',
//     href: '/docs/primitives/tabs',
//     description:
//       'A set of layered sections of content—known as tab panels—that are displayed one at a time.',
//   },
//   {
//     title: 'Tooltip',
//     href: '/docs/primitives/tooltip',
//     description:
//       'A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.',
//   },
// ];

// function ListItem({
//   title,
//   children,
//   href,
//   ...props
// }: React.ComponentPropsWithoutRef<'li'> & { href: string }) {
//   return (
//     <li {...props}>
//       <NavigationMenuLink asChild>
//         <Link href={href}>
//           <div className="text-sm leading-none font-medium">{title}</div>
//           <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
//             {children}
//           </p>
//         </Link>
//       </NavigationMenuLink>
//     </li>
//   );
// }

interface NavigationProps {
  commonDictionary: Record<string, string>;
}

const mainNavigationLinkClassName = cn(
  'group relative inline-flex h-9 w-max items-center justify-center rounded-full border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-[color,background-color,border-color,box-shadow] duration-200 hover:border-orange-300/80 hover:bg-orange-100 hover:text-orange-950 hover:shadow-sm focus:border-orange-300/80 focus:bg-orange-100 focus:text-orange-950 focus:shadow-sm disabled:pointer-events-none disabled:opacity-50 data-[state=open]:border-orange-300/80 data-[state=open]:bg-orange-100 data-[state=open]:text-orange-950 data-[state=open]:shadow-sm dark:hover:border-orange-700/70 dark:hover:bg-orange-900/55 dark:hover:text-orange-50 dark:hover:shadow-sm dark:focus:border-orange-700/70 dark:focus:bg-orange-900/55 dark:focus:text-orange-50 dark:focus:shadow-sm dark:data-[state=open]:border-orange-700/70 dark:data-[state=open]:bg-orange-900/55 dark:data-[state=open]:text-orange-50 dark:data-[state=open]:shadow-sm focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px] focus-visible:outline-1',
);

export function Navigation({ commonDictionary }: NavigationProps) {
  const params = useParams();
  const language = (
    typeof params?.language === 'string' ? params.language : 'en'
  ) as Locale;
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList>
        <NavigationMenuItem asChild>
          <Link
            href={getLocalizedRoute('recipeCreate', language)}
            className={mainNavigationLinkClassName}
          >
            <span className="inline-flex items-center gap-2">
              <PlusIcon className="size-4" />
              {commonDictionary.addRecipe}
            </span>
          </Link>
        </NavigationMenuItem>
        <NavigationMenuItem asChild>
          <Link
            href={getLocalizedRoute('discover', language, {})}
            className={mainNavigationLinkClassName}
          >
            <span>{commonDictionary.discoverRecipes}</span>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
