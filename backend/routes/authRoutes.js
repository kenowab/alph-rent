import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  register,
  login,
  getMe,
  googleAuth,
  googleCallback,
  resendEmail,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'

const router = Router()

const authLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts — please try again later' },
})

router.post(
  '/register',
  authLimiter,
  validateBody({
    name: { required: true, type: 'string', min: 2 },
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', min: 6 },
    phone: { type: 'string', max: 30 },
    role: { enum: ['tenant', 'owner'] },
  }),
  register,
)

router.post(
  '/login',
  authLimiter,
  validateBody({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' },
    role: { enum: ['tenant', 'owner', 'admin'] },
  }),
  login,
)

router.post(
  '/resend-email',
  authLimiter,
  validateBody({
    email: { required: true, type: 'email' },
    name: { type: 'string', min: 2 },
    role: { enum: ['tenant', 'owner', 'admin'] },
  }),
  resendEmail,
)

router.post(
  '/forgot-password',
  authLimiter,
  validateBody({ email: { required: true, type: 'email' } }),
  forgotPassword,
)

router.post(
  '/reset-password',
  authLimiter,
  validateBody({
    token: { required: true, type: 'string', min: 32 },
    password: { required: true, type: 'string', min: 6 },
  }),
  resetPassword,
)

router.get('/google', googleAuth)
router.get('/google/callback', googleCallback)

router.get('/me', protect, getMe)

export default router
