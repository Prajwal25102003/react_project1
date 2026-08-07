import { Router } from 'express'
import { avatarUpload } from '../middleware/avatarUpload.js'
import { leaveMedicalUpload } from '../middleware/leaveMedicalUpload.js'
import {
  uploadAvatarHandler,
  uploadLeaveMedicalHandler,
  uploadErrorHandler,
} from '../controllers/uploadsController.js'
import {
  requireActiveAccount,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware.js'

const router = Router()

router.post(
  '/avatar',
  requireAuth,
  requireActiveAccount,
  requireRole('hr', 'admin'),
  (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (error) => {
      if (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res
            .status(400)
            .json({ message: 'Image must be 2MB or smaller' })
        }
        return uploadErrorHandler(error, req, res, next)
      }
      return next()
    })
  },
  uploadAvatarHandler,
)

router.post(
  '/leave-medical',
  requireAuth,
  requireActiveAccount,
  requireRole('employee', 'hr', 'admin'),
  (req, res, next) => {
    leaveMedicalUpload.single('document')(req, res, (error) => {
      if (error) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res
            .status(400)
            .json({ message: 'Document must be 5MB or smaller' })
        }
        return uploadErrorHandler(error, req, res, next)
      }
      return next()
    })
  },
  uploadLeaveMedicalHandler,
)

export default router
