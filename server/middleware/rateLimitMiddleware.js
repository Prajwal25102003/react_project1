import rateLimit from 'express-rate-limit'

/** Stricter limit on sign-in to slow credential stuffing. */
export const signInRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SIGNIN_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many sign-in attempts. Please try again in a few minutes.',
  },
})

/** General API ceiling — generous for normal UI use. */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_API_MAX) || 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests. Please slow down and try again shortly.',
  },
})
