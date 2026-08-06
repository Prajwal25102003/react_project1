import { Router } from 'express'
import {
  getLeaveApprovalHierarchies,
  getLeaveApprovalHierarchyByCategory,
  updateLeaveApprovalHierarchy,
} from '../controllers/leaveApprovalHierarchyController.js'
import {
  requireActiveAccount,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware.js'
import { validateBody } from '../middleware/validateBody.js'
import { leaveHierarchyWriteSchema } from '../models/requestSchemas.js'

const router = Router()
const adminOnly = [requireAuth, requireRole('admin')]
const adminWrite = [requireAuth, requireActiveAccount, requireRole('admin')]

router.get('/', ...adminOnly, getLeaveApprovalHierarchies)
router.get('/:category', ...adminOnly, getLeaveApprovalHierarchyByCategory)
router.put(
  '/:category',
  ...adminWrite,
  validateBody(leaveHierarchyWriteSchema),
  updateLeaveApprovalHierarchy,
)

export default router
