import { cn } from './cn.js'

/** Shared Tailwind class bundles (replaces custom @utility menu-* names in JSX). */
export const tw = {
  menuItem: cn(
    'text-theme-sm relative flex items-center gap-3 rounded-lg px-3 py-2 font-medium',
  ),
  menuItemActive: cn(
    'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
  ),
  menuItemInactive: cn(
    'text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-gray-300',
  ),
  menuItemIconActive: cn('fill-brand-500 dark:fill-brand-400'),
  menuItemIconInactive: cn(
    'fill-gray-500 group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300',
  ),
  menuItemArrow: cn('absolute right-2.5 top-1/2 -translate-y-1/2'),
  menuItemArrowActive: cn(
    'rotate-180 stroke-brand-500 dark:stroke-brand-400',
  ),
  menuItemArrowInactive: cn(
    'stroke-gray-500 group-hover:stroke-gray-700 dark:stroke-gray-400 dark:group-hover:stroke-gray-300',
  ),
  menuDropdownItem: cn(
    'text-theme-sm relative flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium',
  ),
  menuDropdownItemActive: cn(
    'bg-brand-50 text-brand-500 dark:bg-brand-500/[0.12] dark:text-brand-400',
  ),
  menuDropdownItemInactive: cn(
    'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5',
  ),
}
