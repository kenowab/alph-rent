import { Router } from 'express'
import {
  getAdminDashboard,
  getAdminStats,
  getAdminProperties,
  getAdminPendingProperties,
  approveProperty,
  rejectProperty,
  getAdminUsers,
  getAdminOwners,
  getAdminTenants,
  getAdminApplications,
  getAdminRentalRequests,
  approveRentalRequest,
  rejectRentalRequest,
  getAdminViewings,
  getAdminAgreements,
  updateAdminUser,
} from '../controllers/adminController.js'
import { protect, requireRole } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'

const router = Router()

// Every route below requires an authenticated user with role === 'admin'.
router.use(protect)
router.use(requireRole('admin'))

router.get('/dashboard', getAdminDashboard)
router.get('/stats', getAdminStats)
router.get('/properties', getAdminProperties)
router.get('/properties/pending', getAdminPendingProperties)
router.put(
  '/properties/:id/approve',
  validateBody({ reason: { type: 'string', max: 1000 } }),
  approveProperty,
)
router.put(
  '/properties/:id/reject',
  validateBody({ reason: { type: 'string', max: 1000 } }),
  rejectProperty,
)
router.get('/users', getAdminUsers)
router.put(
  '/users/:id',
  validateBody({
    active: { type: 'boolean' },
    role: { enum: ['tenant', 'owner', 'admin'] },
  }),
  updateAdminUser,
)
router.get('/owners', getAdminOwners)
router.get('/tenants', getAdminTenants)
router.get('/applications', getAdminApplications)
router.get('/rental-requests', getAdminRentalRequests)
router.put('/rental-requests/:id/approve', approveRentalRequest)
router.put(
  '/rental-requests/:id/reject',
  validateBody({ reason: { type: 'string', max: 1000 } }),
  rejectRentalRequest,
)
router.get('/viewings', getAdminViewings)
router.get('/agreements', getAdminAgreements)

export default router
