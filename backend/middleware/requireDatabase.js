import mongoose from 'mongoose'

/** Reject API requests that would otherwise wait in Mongoose's command buffer. */
export function requireDatabase(req, res, next) {
  if (mongoose.connection.readyState === 1) {
    return next()
  }

  res.set('Retry-After', '5')
  return res.status(503).json({
    success: false,
    message: 'Database temporarily unavailable. Please try again later.',
  })
}