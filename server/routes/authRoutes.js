import { Router } from 'express'
import {
  getMeHandler,
  getProfileHandler,
  signInHandler,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/signin', signInHandler)
router.get('/me', requireAuth, getMeHandler)
router.get('/profile', requireAuth, getProfileHandler)

export default router
