import Property from '../models/Property.js'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import { AppError } from '../utils/AppError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { CITIES, normalizeCity } from '../utils/cities.js'
import { imageUrl } from '../middleware/upload.js'

const CATEGORY_ENUM = ['house', 'apartment', 'villa', 'office', 'land', 'studio', 'shop', 'warehouse', 'room', 'commercial']
const AMENITY_FIELDS = ['furnished', 'parking', 'security', 'waterTank', 'elevator']

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const SORTS = {
  newest: { postedAt: -1, createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  popular: { views: -1 },
}

/** Parses an images list that may arrive as a JSON string, an array or a comma-separated string. */
function parseList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean)
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim()).filter(Boolean)
    } catch {
      /* not JSON — fall through to comma split */
    }
    return trimmed
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }
  return []
}

const toBool = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback
  return value === true || value === 'true' || value === 1 || value === '1'
}

/** Reads owner fields from a JSON body (nested `owner`) or a multipart body (flat `owner*`). */
function pickOwner(body) {
  const nested = body.owner && typeof body.owner === 'object' ? body.owner : {}
  const responseRate =
    nested.responseRate !== undefined ? nested.responseRate : body.ownerResponseRate
  return {
    name: nested.name ?? body.ownerName,
    phone: nested.phone ?? body.ownerPhone,
    email: nested.email ?? body.ownerEmail,
    verified:
      nested.verified !== undefined
        ? toBool(nested.verified, undefined)
        : body.ownerVerified !== undefined
          ? toBool(body.ownerVerified, undefined)
          : undefined,
    responseRate: responseRate !== undefined ? Number(responseRate) : undefined,
  }
}

function pickPropertyFields(body) {
  const picked = {}
  const fields = [
    'title', 'description', 'category', 'city', 'subArea', 'address',
    'price', 'bedrooms', 'bathrooms', 'area',
    'furnished', 'parking', 'security', 'waterTank', 'elevator',
  ]
  for (const field of fields) {
    if (body[field] !== undefined) picked[field] = body[field]
  }
  if (picked.area === '' || picked.area === null) picked.area = null
  for (const field of ['bedrooms', 'bathrooms', 'area', 'price']) {
    if (picked[field] !== undefined && picked[field] !== null) picked[field] = Number(picked[field])
  }
  for (const amenity of AMENITY_FIELDS) {
    if (picked[amenity] !== undefined) picked[amenity] = Boolean(picked[amenity])
  }
  // Availability is owner-managed, but only between the states that are not
  // owned by the rental workflow ('pending' and 'rented' are set by the
  // approval/agreement lifecycle and can never come from the form/API).
  if (body.status === 'available' || body.status === 'unavailable') {
    picked.status = body.status
  }
  return picked
}

/**
 * GET /api/properties
 * Query: category, city, q, minPrice, maxPrice, minBedrooms, amenities,
 *        sort (newest|price-asc|price-desc|popular), page, limit, featured
 * Returns: { data: [property...], total }
 */
export const getProperties = asyncHandler(async (req, res) => {
  const {
    category,
    q,
    minPrice,
    maxPrice,
    minBedrooms,
    minBathrooms,
    amenities,
    sort = 'newest',
    page = 1,
    limit,
    status,
    featured,
  } = req.query

  const query = {}
  // Only admin-approved properties are visible to the public. Pending and
  // rejected listings must never appear in the tenant-facing results.
  query.approvalStatus = 'approved'

  if (status && status !== 'all') {
    query.status = status
  } else if (!status) {
    query.status = 'available'
  }

  if (category && category !== 'all') {
    if (!CATEGORY_ENUM.includes(category)) {
      throw new AppError(`Unknown category: ${category}`, 400)
    }
    query.category = category
  }

  const cityName = normalizeCity(req.query.city)
  if (cityName) query.city = cityName

  if (q) {
    const tokens = String(q).trim().split(/\s+/).filter(Boolean)
    if (tokens.length) {
      // Every typed word must match at least one searchable field (title,
      // sub-area, address, description or city), so multi-word queries like
      // "furnished apartment" or "bole addis ababa" actually narrow results.
      query.$and = tokens.map((token) => ({
        $or: ['title', 'subArea', 'address', 'description', 'city'].map((field) => ({
          [field]: { $regex: escapeRegex(token), $options: 'i' },
        })),
      }))
    }
  }

  if (minPrice !== undefined && minPrice !== '') query.price = { ...query.price, $gte: Number(minPrice) }
  if (maxPrice !== undefined && maxPrice !== '') query.price = { ...query.price, $lte: Number(maxPrice) }

  if (minBedrooms && Number(minBedrooms) > 0) query.bedrooms = { $gte: Number(minBedrooms) }

  if (minBathrooms && Number(minBathrooms) > 0) query.bathrooms = { $gte: Number(minBathrooms) }

  if (amenities) {
    const list = Array.isArray(amenities)
      ? amenities
      : String(amenities)
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean)
    for (const amenity of list) {
      if (AMENITY_FIELDS.includes(amenity)) query[amenity] = true
    }
  }

  if (featured === 'true' || featured === true) query.featured = true

  const sortBy = SORTS[sort] || SORTS.newest
  const parsedLimit = limit ? Math.min(Number(limit), 100) : 100
  const parsedPage = Math.max(Number(page) || 1, 1)
  const skip = (parsedPage - 1) * parsedLimit

  const [data, total] = await Promise.all([
    Property.find(query).sort(sortBy).skip(skip).limit(parsedLimit),
    Property.countDocuments(query),
  ])

  res.status(200).json({ success: true, data, total })
})

/**
 * GET /api/properties/suggestions?q=&limit=
 * Returns autocomplete suggestions (cities, sub-areas and property titles)
 * that match the partial query. Works offline against the static city list
 * and live against available listings.
 * Returns: { data: [{ type: 'city'|'area'|'property', label }] }
 */
export const getSearchSuggestions = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim()
  const limit = Math.min(Number(req.query.limit) || 8, 12)

  if (!q) {
    return res.status(200).json({ success: true, data: [] })
  }

  const needle = q.toLowerCase()
  const regex = { $regex: escapeRegex(q), $options: 'i' }
  const suggestions = []
  const seen = new Set()

  const add = (type, label) => {
    const key = `${type}:${label.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)
    suggestions.push({ type, label })
  }

  for (const city of CITIES) {
    if (city.name.toLowerCase().includes(needle)) add('city', city.name)
    for (const area of city.subAreas || []) {
      if (area.toLowerCase().includes(needle)) add('area', `${area}, ${city.name}`)
    }
  }

  const matches = await Property.find({
    status: 'available',
    approvalStatus: 'approved',
    $or: [{ city: regex }, { subArea: regex }, { title: regex }, { address: regex }],
  })
    .select('title city subArea')
    .limit(12)

  for (const property of matches) {
    add('property', property.title)
    add('area', `${property.subArea}, ${property.city}`)
    add('city', property.city)
  }

  res.status(200).json({ success: true, data: suggestions.slice(0, limit) })
})

/**
 * GET /api/properties/mine
 * Requires: Bearer token (owner or admin)
 * Returns: { data: [property...] } owned by the current user
 */
export const getMyProperties = asyncHandler(async (req, res) => {
  const data = await Property.find({ owner: req.user.id }).sort({ createdAt: -1 })
  res.status(200).json({ success: true, data })
})

/**
 * GET /api/properties/:id
 * Increments the view counter.
 * Pending/rejected listings are hidden from the public — only the owning
 * owner or an admin can view them directly.
 * Returns: { data: property }
 */
export const getProperty = asyncHandler(async (req, res) => {
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true, runValidators: true },
  )
  if (!property) {
    throw new AppError('Property not found', 404)
  }

  if (property.approvalStatus !== 'approved') {
    const viewer = await optionalViewer(req)
    const canView =
      viewer && (viewer.role === 'admin' || (property.owner && viewer.id === String(property.owner)))
    if (!canView) {
      throw new AppError('Property not found', 404)
    }
  }

  res.status(200).json({ success: true, data: property })
})

/**
 * Resolves the user from the Authorization header without requiring a token.
 * Returns null when the header is missing or the token is invalid.
 */
async function optionalViewer(req) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) return null
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET)
    return User.findById(decoded.id).select('-password')
  } catch {
    return null
  }
}

/**
 * POST /api/properties
 * Requires: Bearer token (owner or admin)
 * Accepts JSON body (with optional `images: [url]`) or multipart/form-data
 * with up to 8 files under the `images` field.
 * Returns: { data: property }
 */
export const createProperty = asyncHandler(async (req, res) => {
  const body = req.body
  const ownerObj = pickOwner(body)
  const user = req.user

  if (!CATEGORY_ENUM.includes(body.category)) {
    throw new AppError(`Unknown category: ${body.category}`, 400)
  }

  const images = [
    ...(req.files?.length ? req.files.map((file) => imageUrl(req, file.filename)) : []),
    ...parseList(body.existingImages),
  ]
  if (!images.length && Array.isArray(body.images)) images.push(...parseList(body.images))

  const fields = pickPropertyFields(body)
  if (!fields.title || !fields.description || !fields.city || !fields.subArea || !fields.address || fields.price === undefined) {
    throw new AppError('Missing required fields: title, description, city, subArea, address and price are required', 400)
  }

  const property = await Property.create({
    ...fields,
    images,
    approvalStatus: 'pending',
    owner: user.id,
    ownerName: ownerObj.name || user.name,
    ownerPhone: ownerObj.phone || user.phone || '',
    ownerEmail: ownerObj.email || user.email || '',
    ownerVerified: ownerObj.verified ?? user.verified,
    ownerResponseRate: ownerObj.responseRate ?? user.responseRate,
    ownerJoinedAt: user.createdAt,
  })

  res.status(201).json({ success: true, data: property })
})

/**
 * PUT /api/properties/:id
 * Requires: Bearer token — owner of the property or admin
 * Returns: { data: property }
 */
export const updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
  if (!property) {
    throw new AppError('Property not found', 404)
  }

  const isOwner = req.user.id === String(property.owner || '')
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isAdmin) {
    throw new AppError('You can only update your own properties', 403)
  }

  const body = req.body
  const ownerObj = pickOwner(body)
  const fields = pickPropertyFields(body)
  if (fields.category && !CATEGORY_ENUM.includes(fields.category)) {
    throw new AppError(`Unknown category: ${fields.category}`, 400)
  }

  if (fields.status && fields.status !== property.status) {
    if (property.status === 'pending' || property.status === 'rented') {
      throw new AppError(
        'This property is part of an active rental process. Cancel or complete the agreement before changing its availability.',
        400,
      )
    }
  }

  if (req.files?.length || body.existingImages !== undefined) {
    fields.images = [
      ...(req.files?.length ? req.files.map((file) => imageUrl(req, file.filename)) : []),
      ...parseList(body.existingImages),
    ]
  } else if (Array.isArray(body.images)) {
    fields.images = parseList(body.images)
  }

  if (ownerObj.name) fields.ownerName = ownerObj.name
  if (ownerObj.phone) fields.ownerPhone = ownerObj.phone
  if (ownerObj.email) fields.ownerEmail = ownerObj.email
  if (ownerObj.verified !== undefined) fields.ownerVerified = Boolean(ownerObj.verified)
  if (ownerObj.responseRate !== undefined) fields.ownerResponseRate = Number(ownerObj.responseRate)

  Object.assign(property, fields)
  await property.save()

  res.status(200).json({ success: true, data: property })
})

/**
 * DELETE /api/properties/:id
 * Requires: Bearer token — owner of the property or admin
 * Returns: { success: true }
 */
export const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
  if (!property) {
    throw new AppError('Property not found', 404)
  }

  const isOwner = req.user.id === String(property.owner || '')
  const isAdmin = req.user.role === 'admin'
  if (!isOwner && !isAdmin) {
    throw new AppError('You can only delete your own properties', 403)
  }

  await property.deleteOne()
  await Promise.all([
    import('../models/RentalRequest.js').then((m) =>
      m.default.deleteMany({ property: property._id }),
    ),
    import('../models/Favorite.js').then((m) =>
      m.default.deleteMany({ property: property._id }),
    ),
  ])

  res.status(200).json({ success: true })
})
