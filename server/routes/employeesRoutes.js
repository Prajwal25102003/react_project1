import { Router } from 'express'
import {
  assignLeaveBalancesHandler,
  createEmployeeHandler,
  deleteEmployeeHandler,
  getEmployeeById,
  getEmployees,
  updateEmployeeHandler,
} from '../controllers/employeesController.js'
import {
  requireActiveAccount,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  assignLeaveBalancesSchema,
  employeeWriteSchema,
} from '../models/requestSchemas.js'

const router = Router()
const hrAdmin = [requireAuth, requireRole('hr', 'admin')]
const hrAdminWrite = [requireAuth, requireActiveAccount, requireRole('hr', 'admin')]

router.get('/', ...hrAdmin, getEmployees)
router.post(
  '/',
  ...hrAdminWrite,
  validateBody(employeeWriteSchema),
  createEmployeeHandler,
)
router.post(
  '/leave-balances/assign',
  ...hrAdminWrite,
  validateBody(assignLeaveBalancesSchema),
  assignLeaveBalancesHandler,
)
router.get('/:id', ...hrAdmin, getEmployeeById)
router.put(
  '/:id',
  ...hrAdminWrite,
  validateBody(employeeWriteSchema),
  updateEmployeeHandler,
)
router.delete('/:id', ...hrAdminWrite, deleteEmployeeHandler)

export default router
