import { Router } from 'express'
import authRoutes from './authRoutes.js'
import propertyRoutes from './propertyRoutes.js'
import requestRoutes from './requestRoutes.js'
import viewingRoutes from './viewingRoutes.js'
import agreementRoutes from './agreementRoutes.js'
import adminRoutes from './adminRoutes.js'
import messageRoutes from './messageRoutes.js'
import notificationRoutes from './notificationRoutes.js'
import userRoutes from './userRoutes.js'
import favoriteRoutes from './favoriteRoutes.js'
import aiRoutes from './aiRoutes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/properties', propertyRoutes)
router.use('/messages', messageRoutes)
router.use('/notifications', notificationRoutes)
router.use('/favorites', favoriteRoutes)
router.use('/agreements', agreementRoutes)
router.use('/admin', adminRoutes)
router.use('/ai', aiRoutes)

// Request and viewing routes mounted at root level because they include /properties/... and /requests/... or /viewings/...
router.use(requestRoutes)
router.use(viewingRoutes)

// Mounted last so /users/:id does not shadow /users/:userId/requests above.
router.use('/users', userRoutes)

export default router
