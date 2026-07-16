/**
 * API base URL for the Node server.
 * Empty string uses the Vite `/api` proxy in development.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
