import { AppError } from '../utils/AppError.js'

/** 404 handler for unknown routes. */
export function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404))
}

/**
 * Central error handler.
 * Operational AppErrors return their status/message; unexpected errors return 500
 * with a generic message so no internals leak to the client.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let error = { ...err }
  error.message = err.message

  // MongoDB/Mongoose connection failures — the database is temporarily unavailable.
  const isMongoDbUnavailable =
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongooseServerSelectionError' ||
    /connect ETIMEDOUT|timed out|topology/i.test(err.message || '')

  if (isMongoDbUnavailable) {
    error = new AppError('Database temporarily unavailable. Please try again later.', 503)
  }

  // Mongoose: invalid ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    error = new AppError(`Resource not found (invalid id: ${err.value})`, 404)
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    error = new AppError(`A record with this ${field} already exists`, 409)
  }

  // Mongoose: validation failure
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    error = new AppError(messages.join('. '), 400)
  }

  // Multer errors
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image too large — max 3MB per file' : `Upload error: ${err.message}`
    error = new AppError(message, 400)
  }

  const statusCode = error.statusCode || 500
  const isDev = process.env.NODE_ENV === 'development'

  if (statusCode >= 500) {
    console.error(`[ERROR] ${err.stack || err}`)
  }

  res.status(statusCode).json({
    success: false,
    ...(typeof error.code === 'string' ? { code: error.code } : {}),
    message:
      statusCode >= 500 && statusCode !== 503 && !isDev
        ? 'Something went wrong on the server'
        : error.message,
    ...(isDev && statusCode >= 500 ? { stack: err.stack } : {}),
  })
}
