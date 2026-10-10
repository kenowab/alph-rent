import { Router } from 'express'
import {
  createRequest,
  getMyRequests,
  getOwnerRequests,
  getUserRequests,
  updateRequestStatus,
} from '../controllers/requestController.js'
import { protect, authorize } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'

const router = Router()

// POST /api/properties/:propertyId/requests
// Identity (name, email, phone) is taken from the authenticated user loaded by
// `protect` — the body fields are optional extras, never trusted as identity.
router.post(
  '/properties/:propertyId/requests',
  protect,
  validateBody({
    name: { type: 'string', max: 80 },
    phone: { type: 'string', max: 30 },
    email: { type: 'email' },
    moveInDate: { type: 'string' },
    startDate: { type: 'string' },
    endDate: { type: 'string' },
    occupation: { type: 'string' },
    monthlyIncome: { type: 'string' },
    employmentStatus: { type: 'string' },
    message: { type: 'string', max: 2000 },
  }),
  createRequest,
)

// GET /api/requests/mine
router.get('/requests/mine', protect, getMyRequests)

// GET /api/requests/owner
router.get('/requests/owner', protect, authorize('owner', 'admin'), getOwnerRequests)

// PUT /api/requests/:id/status
// Admin only — owners and tenants can never approve or decline rental requests.
router.put(
  '/requests/:id/status',
  protect,
  authorize('admin'),
  validateBody({
    status: { required: true, enum: ['pending', 'approved', 'rejected', 'contacted', 'cancelled'] },
    reason: { type: 'string', max: 1000 },
  }),
  updateRequestStatus,
)

// GET /api/users/:userId/requests
router.get('/users/:userId/requests', protect, getUserRequests)

export default router
