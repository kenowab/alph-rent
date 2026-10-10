import { Router } from 'express'
import { getUsers, getUserProfile, updateUserProfile } from '../controllers/userController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = Router()

router.get('/', protect, authorize('admin'), getUsers)
router.get('/:id', getUserProfile)
router.put('/:id', protect, updateUserProfile)

export default router
