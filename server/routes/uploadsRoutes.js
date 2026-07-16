import { Router } from 'express'
import { avatarUpload } from '../middleware/avatarUpload.js'
import {
  uploadAvatarHandler,
  uploadErrorHandler,
} from '../controllers/uploadsController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.post(
  '/avatar',
  requireAuth,
  requireRole('hr', 'admin'),
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (error) => {
      if (error) return uploadErrorHandler(error, req, res, next)
      return next()
    })
  },
  uploadAvatarHandler,
)

export default router
