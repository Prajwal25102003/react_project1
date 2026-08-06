import { Router } from 'express'
import {
  createDepartmentHandler,
  deleteDepartmentHandler,
  getDepartmentById,
  getDepartments,
  updateDepartmentHandler,
} from '../controllers/departmentsController.js'
import {
  requireActiveAccount,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware.js'
import { validateBody } from '../middleware/validateBody.js'
import { departmentWriteSchema } from '../models/requestSchemas.js'

const router = Router()
const hrAdmin = [requireAuth, requireRole('hr', 'admin')]
const hrAdminWrite = [requireAuth, requireActiveAccount, requireRole('hr', 'admin')]

router.get('/', ...hrAdmin, getDepartments)
router.post(
  '/',
  ...hrAdminWrite,
  validateBody(departmentWriteSchema),
  createDepartmentHandler,
)
router.get('/:id', ...hrAdmin, getDepartmentById)
router.put(
  '/:id',
  ...hrAdminWrite,
  validateBody(departmentWriteSchema),
  updateDepartmentHandler,
)
router.delete('/:id', ...hrAdminWrite, deleteDepartmentHandler)

export default router
