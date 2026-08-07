import { Router } from 'express'
import {
  getMeHandler,
  getProfileHandler,
  logoutHandler,
  signInHandler,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'
import { signInRateLimiter } from '../middleware/rateLimitMiddleware.js'
import { validateBody } from '../middleware/validateBody.js'
import { signInSchema } from '../models/requestSchemas.js'

const router = Router()

router.post(
  '/signin',
  signInRateLimiter,
  validateBody(signInSchema),
  signInHandler,
)
router.post('/logout', requireAuth, logoutHandler)
router.get('/me', requireAuth, getMeHandler)
router.get('/profile', requireAuth, getProfileHandler)

export default router
