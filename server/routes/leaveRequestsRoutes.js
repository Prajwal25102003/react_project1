import { Router } from 'express'
import {
  cancelLeaveRequestHandler,
  createLeaveRequestHandler,
  getLeaveRequestByIdHandler,
  getLeaveRequests,
  updateLeaveRequestStatusHandler,
} from '../controllers/leaveRequestsController.js'
import {
  requireActiveAccount,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  leaveCancelSchema,
  leaveCreateSchema,
  leaveStatusSchema,
} from '../models/requestSchemas.js'

const router = Router()

router.get('/', requireAuth, getLeaveRequests)
router.get('/:id', requireAuth, getLeaveRequestByIdHandler)
router.post(
  '/',
  requireAuth,
  requireActiveAccount,
  requireRole('employee', 'hr'),
  validateBody(leaveCreateSchema),
  createLeaveRequestHandler,
)
router.patch(
  '/:id/status',
  requireAuth,
  requireActiveAccount,
  requireRole('employee', 'hr', 'admin'),
  validateBody(leaveStatusSchema),
  updateLeaveRequestStatusHandler,
)
router.patch(
  '/:id/cancel',
  requireAuth,
  requireActiveAccount,
  requireRole('employee', 'hr'),
  validateBody(leaveCancelSchema),
  cancelLeaveRequestHandler,
)

export default router
