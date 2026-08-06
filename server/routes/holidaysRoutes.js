import { Router } from 'express'
import {
  createHolidayHandler,
  deleteHolidayHandler,
  getHolidayById,
  getHolidayCalendarTemplate,
  getHolidayCalendars,
  getHolidays,
  releaseHolidayCalendarHandler,
  updateHolidayHandler,
} from '../controllers/holidaysController.js'
import {
  requireActiveAccount,
  requireAuth,
  requireRole,
} from '../middleware/authMiddleware.js'
import { validateBody } from '../middleware/validateBody.js'
import {
  holidayReleaseSchema,
  holidayWriteSchema,
} from '../models/requestSchemas.js'

const router = Router()
const adminOnly = [requireAuth, requireRole('admin')]
const adminWrite = [requireAuth, requireActiveAccount, requireRole('admin')]

router.get('/calendars', requireAuth, getHolidayCalendars)
router.get('/calendars/:year/template', ...adminOnly, getHolidayCalendarTemplate)
router.post(
  '/calendars/:year/release',
  ...adminWrite,
  validateBody(holidayReleaseSchema),
  releaseHolidayCalendarHandler,
)

router.get('/', requireAuth, getHolidays)
router.get('/:id', requireAuth, getHolidayById)
router.post(
  '/',
  ...adminWrite,
  validateBody(holidayWriteSchema),
  createHolidayHandler,
)
router.put(
  '/:id',
  ...adminWrite,
  validateBody(holidayWriteSchema),
  updateHolidayHandler,
)
router.delete('/:id', ...adminWrite, deleteHolidayHandler)

export default router
