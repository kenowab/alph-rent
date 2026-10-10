import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/**
 * Authentication middleware.
 * Verifies the `Authorization: Bearer <token>` header and loads the user
 * (without the password hash) onto req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Not authorized — please log in first', 401)
  }

  const token = header.split(' ')[1]
  if (!token) {
    throw new AppError('Not authorized — please log in first', 401)
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired — please log in again' : 'Invalid token — please log in again'
    throw new AppError(message, 401)
  }

  const user = await User.findById(decoded.id).select('-password')
  if (!user) {
    throw new AppError('The user belonging to this token no longer exists', 401)
  }
  if (user.active === false) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403)
  }

  req.user = user
  next()
})

/**
 * Authorization middleware (role-based).
 * Usage: router.post('/', protect, authorize('owner', 'admin'), handler)
 */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized', 401))
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not allowed to perform this action`, 403),
      )
    }
    next()
  }

/** Alias for `authorize` — kept for backwards compatibility. */
export const requireRole = authorize
