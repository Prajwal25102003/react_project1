import { Router } from 'express'
import {
  getLeaveApprovalHierarchies,
  getLeaveApprovalHierarchyByCategory,
  updateLeaveApprovalHierarchy,
} from '../controllers/leaveApprovalHierarchyController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()
const adminOnly = [requireAuth, requireRole('admin')]

router.get('/', ...adminOnly, getLeaveApprovalHierarchies)
router.get('/:category', ...adminOnly, getLeaveApprovalHierarchyByCategory)
router.put('/:category', ...adminOnly, updateLeaveApprovalHierarchy)

export default router
