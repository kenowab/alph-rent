import OpenAI from 'openai'
import Property from '../models/Property.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/AppError.js'

let openai = null
function getClient() {
  if (!openai) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
    if (apiKey) {
      openai = new OpenAI({
        apiKey,
        ...(process.env.GEMINI_API_KEY
          ? { baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' }
          : {}),
      })
    }
  }
  return openai
}

function getModel() {
  return process.env.AI_MODEL || 'gemini-3.6-flash'
}

const CATEGORIES = ['house', 'apartment', 'villa', 'office', 'land', 'studio', 'shop', 'warehouse', 'room', 'commercial']

const SYSTEM_PROMPT = `You are the AI assistant for Alpha Rent Ethiopia â€” Ethiopia's trusted property rental marketplace. You help tenants find properties, help owners list properties, and answer general questions about the platform.

Key facts about Alpha Rent Ethiopia:
- Tenants can browse and search properties by city, category, price, bedrooms, amenities etc.
- Tenants can send rental requests to property owners through the platform.
- Owners can list their properties (houses, apartments, villas, offices, etc.) for rent.
- Properties must be approved by an admin before they become visible to tenants.
- After a rental request is approved, a rental agreement can be created.
- Users can have roles: tenant, owner, or admin.
- The platform supports multiple languages: English, Afaan Oromo, and Amharic.
- Property categories include: house, apartment, villa, office, land, studio, shop, warehouse, room, commercial.
- Available cities include: Addis Ababa, Adama, Bahir Dar, Dire Dawa, Hawassa, Mekelle, Jimma, Gondar, Debre Markos, Harar.

How rental requests work:
1. A tenant views a property and clicks "Request to Rent"
2. They fill in their details (name, phone, move-in date, etc.)
3. The owner receives the request and can approve, reject, or contact the tenant.
4. If approved, a rental agreement is created.
5. The property status changes to "pending" during the process and "rented" once the agreement is active.

How to list a property (for owners):
1. Sign up as an owner or switch to owner role.
2. Go to Dashboard > Post a new property.
3. Fill in the details (title, description, category, location, price, amenities, photos).
4. Submit for admin review â€” once approved, the property appears in public listings.

How to contact an owner:
- On any property detail page, the owner's contact information (name, phone, email) is displayed.
- Tenants can also send a rental request which includes their contact information.

IMPORTANT RULES:
- Always respond in the SAME LANGUAGE the user writes in. If they write in Afaan Oromo, respond in Afaan Oromo. If they write in Amharic, respond in Amharic. If they write in English, respond in English.
- Be helpful, concise, and friendly.
- When the user asks to find/search properties, use the property_search tool to search the database and return real results.
- NEVER make up or invent properties. Only reference properties returned by the property search.
- If you don't have enough information to answer, ask clarifying questions.
- Prices are in Ethiopian Birr (ETB) per month.`

async function searchProperties(params) {
  const query = { approvalStatus: 'approved', status: 'available' }

  if (params.city) {
    query.city = { $regex: new RegExp(params.city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }
  }
  if (params.category && CATEGORIES.includes(params.category)) {
    query.category = params.category
  }
  if (params.minPrice || params.maxPrice) {
    query.price = {}
    if (params.minPrice) query.price.$gte = Number(params.minPrice)
    if (params.maxPrice) query.price.$lte = Number(params.maxPrice)
  }
  if (params.bedrooms) {
    query.bedrooms = { $gte: Number(params.bedrooms) }
  }

  const textTokens = params.keywords || []
  if (textTokens.length) {
    query.$and = textTokens.map((token) => ({
      $or: ['title', 'subArea', 'address', 'description', 'city'].map((field) => ({
        [field]: { $regex: token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
      })),
    }))
  }

  const results = await Property.find(query).sort({ postedAt: -1 }).limit(10)
  return results.map((p) => ({
    id: p._id.toString(),
    title: p.title,
    category: p.category,
    city: p.city,
    subArea: p.subArea,
    price: p.price,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    description: p.description.substring(0, 200),
    furnished: p.furnished,
    parking: p.parking,
  }))
}

function buildPropertyContext(results) {
  if (!results.length) return 'No matching properties found in the database.'
  const lines = results.map(
    (p, i) =>
      `${i + 1}. ${p.title} â€” ${p.category} in ${p.subArea}, ${p.city}. Price: ${p.price} ETB/month. ${p.bedrooms} bed, ${p.bathrooms} bath. ${p.area ? p.area + 'mÂ².' : ''} ${p.furnished ? 'Furnished.' : ''} ${p.parking ? 'Parking available.' : ''} ID: ${p.id}`,
  )
  return 'Matching properties from the database:\n' + lines.join('\n')
}

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'property_search',
      description:
        'Search for available properties in the Alpha Rent Ethiopia database. Use this when the user wants to find, search, or browse properties.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City name, e.g. Addis Ababa, Nekemte, Hawassa' },
          category: {
            type: 'string',
            enum: CATEGORIES,
            description: 'Property type/category',
          },
          minPrice: { type: 'number', description: 'Minimum price in ETB per month' },
          maxPrice: { type: 'number', description: 'Maximum price in ETB per month' },
          bedrooms: { type: 'number', description: 'Minimum number of bedrooms' },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            description: 'Additional search keywords from the user query',
          },
        },
        required: [],
      },
    },
  },
]

/**
 * POST /api/ai/chat
 * Body: { message: string }
 * Optional auth â€” if token present, user info is available.
 */
export const chat = asyncHandler(async (req, res) => {
  const { message } = req.body
  if (!message || !message.trim()) {
    throw new AppError('Please provide a message', 400)
  }

  const client = getClient()
  if (!client) {
    throw new AppError('AI service is not configured. Please contact the administrator.', 503)
  }

  const userLanguage = detectLanguage(message)

  const conversationHistory = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: message },
  ]

  let response = await client.chat.completions.create({
    model: getModel(),
    messages: conversationHistory,
    tools: TOOLS,
    tool_choice: 'auto',
    max_tokens: 1024,
    temperature: 0.7,
  })

  let assistantMessage = response.choices[0].message

  if (assistantMessage.tool_calls) {
    for (const toolCall of assistantMessage.tool_calls) {
      if (toolCall.function.name === 'property_search') {
        const args = JSON.parse(toolCall.function.arguments)
        const results = await searchProperties(args)
        const propertyContext = buildPropertyContext(results)

        conversationHistory.push(assistantMessage)
        conversationHistory.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: propertyContext,
        })

        response = await client.chat.completions.create({
          model: getModel(),
          messages: conversationHistory,
          tools: TOOLS,
          tool_choice: 'auto',
          max_tokens: 1024,
          temperature: 0.7,
        })

        assistantMessage = response.choices[0].message
      }
    }
  }

  const reply = assistantMessage.content || 'I could not generate a response. Please try again.'

  res.status(200).json({ success: true, data: { reply } })
})

/**
 * POST /api/ai/generate-description
 * Body: { title, category, city, subArea, bedrooms, bathrooms, area, furnished, parking, security, waterTank, elevator }
 * Requires: Bearer token (owner)
 */
export const generateDescription = asyncHandler(async (req, res) => {
  const { title, category, city, subArea, bedrooms, bathrooms, area, furnished, parking, security, waterTank, elevator, language } = req.body

  const client = getClient()
  if (!client) {
    throw new AppError('AI service is not configured. Please contact the administrator.', 503)
  }

  const langInstruction = {
    en: 'Write the description in English.',
    om: 'Write the description in Afaan Oromoo.',
    am: 'Write the description in Amharic (áŠ áˆ›áˆ­áŠ›).',
  }[language] || 'Write the description in English.'

  const amenities = []
  if (furnished) amenities.push('furnished')
  if (parking) amenities.push('parking')
  if (security) amenities.push('security')
  if (waterTank) amenities.push('water tank')
  if (elevator) amenities.push('elevator')

  const prompt = `Generate a professional, attractive property listing description for a rental property.

Property details:
- Title: ${title || 'Not specified'}
- Type: ${category || 'Not specified'}
- Location: ${subArea ? subArea + ', ' : ''}${city || 'Not specified'}
- Bedrooms: ${bedrooms ?? 'Not specified'}
- Bathrooms: ${bathrooms ?? 'Not specified'}
- Area: ${area ? area + 'mÂ²' : 'Not specified'}
- Amenities: ${amenities.length ? amenities.join(', ') : 'None specified'}

Requirements:
- ${langInstruction}
- Write 2-3 paragraphs (150-300 words).
- Highlight the key features and location advantages.
- Make it sound professional and appealing to potential tenants.
- Do NOT include the price.
- Do NOT use overly promotional language.
- Focus on practical details tenants care about.
- If the city is Addis Ababa, mention the neighborhood character.
- Return ONLY the description text, no headings or labels.`

  const response = await client.chat.completions.create({
    model: getModel(),
    messages: [
      { role: 'system', content: 'You are a professional real estate copywriter specializing in Ethiopian rental properties. Write compelling, accurate property descriptions.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 512,
    temperature: 0.8,
  })

  const description = response.choices[0].message.content?.trim() || ''

  res.status(200).json({ success: true, data: { description } })
})

function detectLanguage(text) {
  const amharicRegex = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF\uAB00-\uAB2F]/
  const oromoRegex = /[uggageaaversinotteiddiibboobbnn]/
  const hasAmharic = amharicRegex.test(text)
  if (hasAmharic) return 'am'
  const lower = text.toLowerCase()
  const oromoWords = ['akkam', 'jirta', 'naa', 'wanii', 'kee', 'koo', 'isaa', 'jedha', 'barbaad', 'qabeenya', 'mana', 'kireeff', 'gargaar']
  if (oromoWords.some((w) => lower.includes(w))) return 'om'
  return 'en'
}
