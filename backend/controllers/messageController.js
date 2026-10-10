import Message from '../models/Message.js'
import User from '../models/User.js'
import Property from '../models/Property.js'
import Notification from '../models/Notification.js'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isObjectId } from '../middleware/validate.js'

const MESSAGE_POPULATE = [
  { path: 'sender', select: 'name email' },
  { path: 'recipient', select: 'name email' },
  { path: 'property', select: 'title address city' },
]

/**
 * GET /api/messages
 * Requires: Bearer token
 * Returns: { data: [message...] } — flat list of messages sent to or received
 * by the current user, newest first.
 */
export const getMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const data = await Message.find({
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .populate(MESSAGE_POPULATE)
    .sort({ createdAt: -1 })

  res.status(200).json({ success: true, data })
})

/**
 * GET /api/messages/conversations
 * Requires: Bearer token
 * Returns: { data: [conversation...] } — one entry per (other party, property)
 * pair, each with the latest message, unread count, and the property summary.
 */
export const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const messages = await Message.find({
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .populate('sender', 'name email')
    .populate('recipient', 'name email')
    .populate('property', 'title address city price images')
    .sort({ createdAt: 1 })

  const groups = new Map()

  for (const msg of messages) {
    const isSender = String(msg.sender?._id || msg.sender) === userId
    const other = isSender ? msg.recipient : msg.sender
    const otherId = other?._id ? String(other._id) : String(other)
    if (!otherId) continue

    const propertyId = msg.property?._id ? String(msg.property._id) : String(msg.property || 'general')
    const key = `${propertyId}:${otherId}`

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        property: msg.property
          ? {
              id: msg.property._id,
              title: msg.property.title,
              address: msg.property.address,
              city: msg.property.city,
              price: msg.property.price,
              image: msg.property.images && msg.property.images[0] ? msg.property.images[0] : null,
            }
          : null,
        otherUser: {
          id: otherId,
          name: other?.name || msg.recipientName || 'Unknown',
          email: other?.email || '',
        },
        unreadCount: 0,
        lastMessage: null,
        lastMessageAt: msg.createdAt,
      })
    }

    const group = groups.get(key)
    if (!msg.read && !isSender) group.unreadCount += 1
    if (!group.lastMessage || msg.createdAt >= group.lastMessageAt) {
      group.lastMessage = {
        id: msg.id || String(msg._id),
        content: msg.content,
        createdAt: msg.createdAt,
        fromMe: isSender,
      }
      group.lastMessageAt = msg.createdAt
    }
  }

  const data = [...groups.values()].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))

  res.status(200).json({ success: true, data })
})

/**
 * GET /api/messages/conversations/:propertyId/:otherId
 * Requires: Bearer token
 * Returns: { data: [message...] } — the thread between the current user and
 * :otherId about :propertyId, oldest first. Incoming messages are marked read.
 */
export const getConversationMessages = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { propertyId, otherId } = req.params

  if (!isObjectId(otherId)) {
    throw new AppError('Invalid user id', 400)
  }

  const scoped = isObjectId(propertyId) && propertyId !== 'general'
  const filter = {
    $or: [
      { sender: userId, recipient: otherId },
      { sender: otherId, recipient: userId },
    ],
  }
  if (scoped) filter.$or = filter.$or.map((clause) => ({ ...clause, property: propertyId }))

  const data = await Message.find(filter)
    .populate(MESSAGE_POPULATE)
    .sort({ createdAt: 1 })

  await Message.updateMany(
    { sender: otherId, recipient: userId, read: false, ...(scoped ? { property: propertyId } : {}) },
    { read: true },
  )

  res.status(200).json({ success: true, data })
})

/**
 * POST /api/messages
 * Requires: Bearer token
 * Body: { recipientId, content, propertyId?, senderId? }
 * The sender always comes from the authenticated token. The recipient must be
 * a real user id. When propertyId is given it is validated, so conversations
 * stay anchored to a listing.
 * Returns: { data: message }
 */
export const createMessage = asyncHandler(async (req, res) => {
  const { recipientId, content, propertyId } = req.body

  if (!recipientId) {
    throw new AppError('recipientId is required', 400)
  }
  if (!content || !content.trim()) {
    throw new AppError('Message content is required', 400)
  }

  const recipient = await User.findById(recipientId).select('name email')
  if (!recipient) {
    throw new AppError('Recipient not found', 404)
  }
  if (String(recipient._id) === req.user.id) {
    throw new AppError('You cannot send a message to yourself', 400)
  }

  let property = null
  if (propertyId) {
    if (!isObjectId(propertyId)) {
      throw new AppError('Invalid property id', 400)
    }
    property = await Property.findById(propertyId).select('title owner')
    if (!property) {
      throw new AppError('Property not found', 404)
    }
  }

  const message = await Message.create({
    sender: req.user.id,
    recipient: recipient._id,
    recipientName: recipient.name,
    property: property ? property._id : null,
    content: content.trim(),
    read: false,
  })

  await Notification.create({
    user: recipient._id,
    type: 'message',
    title: `New message about ${property ? property.title : 'your property'}`,
    body: `${req.user.name || 'Someone'}: ${content.trim().slice(0, 140)}`,
    property: property ? property._id : null,
    actor: req.user.id,
  })

  const data = await Message.findById(message.id).populate(MESSAGE_POPULATE)

  res.status(201).json({ success: true, data })
})

/**
 * PUT /api/messages/read
 * Requires: Bearer token
 * Body: { otherId, propertyId? }
 * Marks all messages from the given party about the given property as read.
 */
export const markConversationRead = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { otherId, propertyId } = req.body

  if (!otherId || !isObjectId(otherId)) {
    throw new AppError('otherId is required', 400)
  }

  const filter = { sender: otherId, recipient: userId, read: false }
  if (propertyId && isObjectId(propertyId)) {
    filter.property = propertyId
  }

  const result = await Message.updateMany(filter, { read: true })
  res.status(200).json({ success: true, data: { updated: result.modifiedCount } })
})
