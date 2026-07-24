import { Router } from 'express'
import {
  assignLeaveBalancesHandler,
  createEmployeeHandler,
  deleteEmployeeHandler,
  getEmployeeById,
  getEmployees,
  updateEmployeeHandler,
} from '../controllers/employeesController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()
const hrAdmin = [requireAuth, requireRole('hr', 'admin')]

router.get('/', ...hrAdmin, getEmployees)
router.post('/', ...hrAdmin, createEmployeeHandler)
router.post('/leave-balances/assign', ...hrAdmin, assignLeaveBalancesHandler)
router.get('/:id', ...hrAdmin, getEmployeeById)
router.put('/:id', ...hrAdmin, updateEmployeeHandler)
router.delete('/:id', ...hrAdmin, deleteEmployeeHandler)

export default router
