/**
 * Shared TailAdmin form layout classes for EMS screens.
 * Use these for labels, inputs, selects, and textareas so new forms
 * match Sign In / the original TailAdmin Form Elements look.
 */

export const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-gray-700";

export const INPUT_CLASS =
  "box-border h-11 w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

export const INPUT_ERROR_CLASS =
  "box-border h-11 w-full min-w-0 max-w-full rounded-lg border border-error-500 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-error-500 focus:outline-hidden focus:ring-3 focus:ring-error-500/10";

export const SELECT_TRIGGER_CLASS =
  "box-border flex h-11 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60";

export const SELECT_TRIGGER_ERROR_CLASS =
  "box-border flex h-11 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border border-error-500 bg-white px-4 py-2.5 text-left text-sm text-gray-800 shadow-theme-xs focus:border-error-500 focus:outline-hidden focus:ring-3 focus:ring-error-500/10 disabled:cursor-not-allowed disabled:opacity-60";

export const FIELD_ERROR_CLASS = "mt-1.5 text-theme-xs text-error-600";

export const TEXTAREA_CLASS =
  "box-border w-full min-w-0 max-w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10";

/** Two-column form grid (TailAdmin Form Elements layout). */
export const FORM_GRID_CLASS =
  "grid min-w-0 max-w-full grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 [&>*]:min-w-0";

/** Stack of fields inside a PageCard body. */
export const FORM_STACK_CLASS = "min-w-0 max-w-full space-y-5";
