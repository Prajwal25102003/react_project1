import { Router } from 'express'
import {
  cancelLeaveRequestHandler,
  createLeaveRequestHandler,
  getLeaveRequests,
  updateLeaveRequestStatusHandler,
} from '../controllers/leaveRequestsController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', requireAuth, getLeaveRequests)
router.post('/', requireAuth, requireRole('employee'), createLeaveRequestHandler)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('hr', 'admin'),
  updateLeaveRequestStatusHandler,
)
router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('employee'),
  cancelLeaveRequestHandler,
)

export default router
