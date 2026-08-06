import { Router } from 'express'
import {
  deleteAttendanceHandler,
  getAttendance,
  getAttendanceById,
  importAttendanceHandler,
  updateAttendanceHandler,
} from '../controllers/attendanceController.js'
import {
  requireActiveAccount,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  attendanceImportSchema,
  attendanceUpdateSchema,
} from '../models/requestSchemas.js'

const router = Router()
const hrAdminWrite = [requireAuth, requireActiveAccount, requireRole('hr', 'admin')]

router.get('/', requireAuth, getAttendance)
router.post(
  '/import',
  ...hrAdminWrite,
  validateBody(attendanceImportSchema),
  importAttendanceHandler,
)
router.get('/:id', requireAuth, getAttendanceById)
router.put(
  '/:id',
  ...hrAdminWrite,
  validateBody(attendanceUpdateSchema),
  updateAttendanceHandler,
)
router.delete('/:id', ...hrAdminWrite, deleteAttendanceHandler)

export default router
