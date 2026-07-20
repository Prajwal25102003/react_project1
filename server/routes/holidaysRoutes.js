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
import { requireAuth, requireRole } from '../middleware/authMiddleware.js'

const router = Router()
const adminOnly = [requireAuth, requireRole('admin')]

router.get('/calendars', requireAuth, getHolidayCalendars)
router.get('/calendars/:year/template', ...adminOnly, getHolidayCalendarTemplate)
router.post('/calendars/:year/release', ...adminOnly, releaseHolidayCalendarHandler)

router.get('/', requireAuth, getHolidays)
router.get('/:id', requireAuth, getHolidayById)
router.post('/', ...adminOnly, createHolidayHandler)
router.put('/:id', ...adminOnly, updateHolidayHandler)
router.delete('/:id', ...adminOnly, deleteHolidayHandler)

export default router
