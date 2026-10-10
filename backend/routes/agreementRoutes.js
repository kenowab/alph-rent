import { Router } from 'express'
import {
  getMyAgreements,
  getAgreementById,
  updateAgreementStatus,
} from '../controllers/agreementController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.get('/mine', protect, getMyAgreements)
router.get('/:id', protect, getAgreementById)
router.put('/:id/status', protect, updateAgreementStatus)

export default router
