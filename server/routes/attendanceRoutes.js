import { Router } from 'express'
import {
  createAttendanceHandler,
  deleteAttendanceHandler,
  getAttendance,
  getAttendanceById,
  importAttendanceHandler,
  updateAttendanceHandler,
} from '../controllers/attendanceController.js'
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()
const hrAdmin = [requireAuth, requireRole('hr', 'admin')]

router.get('/', requireAuth, getAttendance)
router.post('/import', ...hrAdmin, importAttendanceHandler)
router.post('/', ...hrAdmin, createAttendanceHandler)
router.get('/:id', requireAuth, getAttendanceById)
router.put('/:id', ...hrAdmin, updateAttendanceHandler)
router.delete('/:id', ...hrAdmin, deleteAttendanceHandler)

export default router
