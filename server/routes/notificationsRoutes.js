import { Router } from 'express'
import { getNotifications } from '../controllers/notificationsController.js'
import { requireAuth } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', requireAuth, getNotifications)

export default router
