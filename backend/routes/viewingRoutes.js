import { Router } from 'express'
import {
  createViewingRequest,
  getMyViewings,
  getOwnerViewings,
  updateViewingStatus,
} from '../controllers/viewingController.js'
import { protect, requireRole } from '../middleware/auth.js'

const router = Router()

router.post('/properties/:propertyId/viewings', protect, createViewingRequest)
router.get('/viewings/mine', protect, getMyViewings)
router.get('/viewings/owner', protect, requireRole('owner', 'admin'), getOwnerViewings)
router.put('/viewings/:id/status', protect, updateViewingStatus)

export default router
