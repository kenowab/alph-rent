import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { connectDB, disconnectDB } from './config/database.js'
import apiRoutes from './routes/index.js'
import { notFound, errorHandler } from './middleware/error.js'
import { requireDatabase } from './middleware/requireDatabase.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load backend/.env (project dir is the parent of backend/)
loadEnv({ path: path.resolve(__dirname, '.env') })

const app = express()

// Security & parsing middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)
app.use(cors({ origin: corsOrigin(), credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

// Serve uploaded property images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Health check
app.get('/api/health', (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1

  res.status(200).json({
    success: true,
    message: 'Alpha Rental Platform API is running',
    database: dbConnected ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  })
})

// API routes
app.use('/api', requireDatabase, apiRoutes)

// 404 + centralized error handling
app.use(notFound)
app.use(errorHandler)

function corsOrigin() {
  const raw = process.env.CORS_ORIGIN
  if (!raw) return true // allow all origins (development)
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean)
}

const PORT = Number(process.env.PORT) || 5000

const server = app.listen(PORT, async () => {
  try {
    await connectDB()
    console.log(`API running on http://localhost:${PORT}`)
  } catch (err) {
    console.warn('[WARN] MongoDB unavailable. Starting API in degraded mode.')
    console.warn(err.message)
    console.log(`API running on http://localhost:${PORT} (MongoDB disconnected)`)
  }
})

// Graceful shutdown
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down...`)
  server.close(async () => {
    await disconnectDB().catch(() => {})
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
