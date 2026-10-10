import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDB, disconnectDB } from './config/database.js'
import apiRoutes from './routes/index.js'
import { notFound, errorHandler } from './middleware/error.js'

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
  res.status(200).json({
    success: true,
    message: 'Alpha Rent Ethiopia API is running',
    time: new Date().toISOString(),
  })
})

// API routes
app.use('/api', apiRoutes)

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
  } catch (err) {
    console.error('[FATAL] Failed to connect to MongoDB:', err.message)
    server.close(() => process.exit(1))
    return
  }
  console.log(`API running on http://localhost:${PORT}`)
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
