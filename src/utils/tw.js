import { cn } from "./cn.js";

/** Shared Tailwind class bundles (replaces custom @utility menu-* names in JSX). */
export const tw = {
  menuItem: cn(
    "text-theme-sm relative flex items-center gap-3 rounded-lg px-3 py-2 font-medium",
  ),
  menuItemActive: cn("bg-brand-50 text-brand-500"),
  menuItemInactive: cn("text-gray-700 hover:bg-gray-100 hover:text-gray-700"),
  menuItemIconActive: cn("fill-brand-500"),
  menuItemIconInactive: cn("fill-gray-500 group-hover:fill-gray-700"),
};
