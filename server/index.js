import express from 'express'
import cors from 'cors'
import { testConnection } from './config/db.js'
import { formatDbError } from './utils/formatDbError.js'
import healthRoutes from './routes/healthRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRoutes)

async function start() {
  try {
    const info = await testConnection()
    console.log(`Connected to PostgreSQL → ${info.database} as ${info.user}`)
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', formatDbError(error))
    console.error('API will still start — check /api/health after starting the DB service')
  }

  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`)
  })
}

start()
