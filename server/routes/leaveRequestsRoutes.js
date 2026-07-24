import { Router } from 'express'
import {
  cancelLeaveRequestHandler,
  createLeaveRequestHandler,
  getLeaveRequestByIdHandler,
  getLeaveRequests,
  updateLeaveRequestStatusHandler,
} from '../controllers/leaveRequestsController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.get('/', requireAuth, getLeaveRequests)
router.get('/:id', requireAuth, getLeaveRequestByIdHandler)
router.post(
  '/',
  requireAuth,
  requireRole('employee', 'hr'),
  createLeaveRequestHandler,
)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('employee', 'hr', 'admin'),
  updateLeaveRequestStatusHandler,
)
router.patch(
  '/:id/cancel',
  requireAuth,
  requireRole('employee', 'hr'),
  cancelLeaveRequestHandler,
)

export default router
