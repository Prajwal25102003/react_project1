import express from 'express'
import cors from 'cors'
import { connectDatabase } from './config/db.js'
import { createCorsOptions } from './config/cors.js'
import healthRoutes from './routes/healthRoutes.js'
import authRoutes from './routes/authRoutes.js'
import employeesRoutes from './routes/employeesRoutes.js'
import departmentsRoutes from './routes/departmentsRoutes.js'
import attendanceRoutes from './routes/attendanceRoutes.js'
import leaveRequestsRoutes from './routes/leaveRequestsRoutes.js'
import leaveApprovalHierarchyRoutes from './routes/leaveApprovalHierarchyRoutes.js'
import holidaysRoutes from './routes/holidaysRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import notificationsRoutes from './routes/notificationsRoutes.js'
import uploadsRoutes from './routes/uploadsRoutes.js'
import { apiRateLimiter } from './middleware/rateLimitMiddleware.js'
import { requireUploadAccess } from './middleware/uploadsAccessMiddleware.js'
import { serveProtectedUploadHandler } from './controllers/uploadsStaticController.js'
import { describeDbError } from './utils/formatDbError.js'

const app = express()
const PORT = Number(process.env.PORT) || 5000

app.use(cors(createCorsOptions()))
app.use(express.json({ limit: '2mb' }))

// Uploads require a valid JWT (Bearer header or ?access_token= for <img>/<a>).
app.get('/uploads/:filename', requireUploadAccess, serveProtectedUploadHandler)

app.use('/api/health', healthRoutes)
app.use('/api', apiRateLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/employees', employeesRoutes)
app.use('/api/departments', departmentsRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/leave-requests', leaveRequestsRoutes)
app.use('/api/leave-approval-hierarchies', leaveApprovalHierarchyRoutes)
app.use('/api/holidays', holidaysRoutes)
app.use('/api/uploads', uploadsRoutes)

app.get('/', (_req, res) => {
  res.json({ message: 'Employee Management API' })
})

function assertAuthConfig() {
  if (!String(process.env.JWT_SECRET || '').trim()) {
    console.error('JWT_SECRET must be set in server/.env (no default secret).')
    process.exit(1)
  }
}

async function start() {
  try {
    assertAuthConfig()
    const info = await connectDatabase()
    console.log(
      `Connected to PostgreSQL → ${info.database} as ${info.user}`,
    )

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error(`Failed to connect to PostgreSQL: ${describeDbError(error)}`)
    console.error('Check DB settings in server/.env')
    process.exit(1)
  }
}

start()
