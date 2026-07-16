import { Router } from 'express'
import {
  createDepartmentHandler,
  deleteDepartmentHandler,
  getDepartmentById,
  getDepartments,
  updateDepartmentHandler,
} from '../controllers/departmentsController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()
const hrAdmin = [requireAuth, requireRole('hr', 'admin')]

router.get('/', ...hrAdmin, getDepartments)
router.post('/', ...hrAdmin, createDepartmentHandler)
router.get('/:id', ...hrAdmin, getDepartmentById)
router.put('/:id', ...hrAdmin, updateDepartmentHandler)
router.delete('/:id', ...hrAdmin, deleteDepartmentHandler)

export default router
