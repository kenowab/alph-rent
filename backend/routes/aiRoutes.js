import { Router } from 'express'
import { chat, generateDescription } from '../controllers/aiController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

router.post('/chat', chat)
router.post('/generate-description', protect, generateDescription)

export default router
