/**
 * Seed script for Alpha Rent Ethiopia.
 *
 * Usage (from server/):
 *   npm run seed           # wipes managed collections, then seeds demo data
 *   npm run seed:delete    # wipes managed collections only
 *
 * Requires server/.env with MONGO_URI and JWT_SECRET.
 */
import path from 'path'
import { fileURLToPath } from 'url'
import { config as loadEnv } from 'dotenv'
import { connectDB, disconnectDB } from './config/database.js'
import User from './models/User.js'
import Property from './models/Property.js'
import RentalRequest from './models/RentalRequest.js'
import ViewingRequest from './models/ViewingRequest.js'
import RentalAgreement from './models/RentalAgreement.js'
import Message from './models/Message.js'
import Notification from './models/Notification.js'
import Favorite from './models/Favorite.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadEnv({ path: path.resolve(__dirname, '.env') })

const DELETE_ONLY = process.argv.includes('--delete')

// Admin credentials come from the environment. In development a fallback is
// used so the demo still works out of the box.
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@alpharent.et').toLowerCase()
const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'

const owner = ({ name, phone, email }) => ({ name, phone, email })

const MOCK_OWNERS = [
  owner({ name: 'Abebe Kebede', phone: '+251 911 234 567', email: 'abebe.kebede@gmail.com' }),
  owner({ name: 'Selam Tesfaye', phone: '+251 912 876 543', email: 'selam.tesfaye@yahoo.com' }),
  owner({ name: 'Daniel Mekonnen', phone: '+251 913 456 789', email: 'daniel.mek@outlook.com' }),
  owner({ name: 'Hanna Girma', phone: '+251 914 111 222', email: 'hanna.girma@gmail.com' }),
  owner({ name: 'Yonatan Assefa', phone: '+251 915 333 444', email: 'yonatan.assefa@gmail.com' }),
  owner({ name: 'Marta Alemu', phone: '+251 916 555 666', email: 'marta.alemu@gmail.com' }),
  owner({ name: 'Bereket Hailu', phone: '+251 917 777 888', email: 'bereket.hailu@gmail.com' }),
  owner({ name: 'Sara Lemma', phone: '+251 918 999 000', email: 'sara.lemma@gmail.com' }),
]

const P = (p) => ({
  featured: false,
  bedrooms: 0,
  bathrooms: 1,
  area: null,
  furnished: false,
  parking: false,
  elevator: false,
  waterTank: false,
  security: false,
  views: 120,
  status: 'available',
  postedAt: new Date('2026-08-01'),
  description: '',
  ...p,
})

// Local copies of property photos served from the frontend /public/images/properties.
// Sources: Unsplash (Unsplash License — free for commercial & personal use).
const IMG = (name) => `/images/properties/${name}`

const IMAGES = {
  apartmentExterior: [
    IMG('apartment-1.jpg'),
    IMG('apartment-2.jpg'),
    IMG('apartment-3.jpg'),
    IMG('apartment-4.jpg'),
  ],
  houseExterior: [
    IMG('house-1.jpg'),
    IMG('house-2.jpg'),
    IMG('house-3.jpg'),
    IMG('house-4.jpg'),
    IMG('house-5.jpg'),
    IMG('house-6.jpg'),
  ],
  livingRoom: [
    IMG('livingroom-1.jpg'),
    IMG('livingroom-2.jpg'),
    IMG('livingroom-3.jpg'),
    IMG('livingroom-4.jpg'),
    IMG('livingroom-5.jpg'),
    IMG('livingroom-6.jpg'),
    IMG('livingroom-7.jpg'),
    IMG('livingroom-8.jpg'),
  ],
  bedroom: [
    IMG('bedroom-1.jpg'),
    IMG('bedroom-2.jpg'),
    IMG('bedroom-3.jpg'),
    IMG('bedroom-4.jpg'),
    IMG('bedroom-5.jpg'),
    IMG('bedroom-6.jpg'),
  ],
  kitchen: [
    IMG('kitchen-1.jpg'),
    IMG('kitchen-2.jpg'),
    IMG('kitchen-3.jpg'),
    IMG('kitchen-4.jpg'),
    IMG('kitchen-5.jpg'),
    IMG('kitchen-6.jpg'),
  ],
  bathroom: [
    IMG('bathroom-1.jpg'),
    IMG('bathroom-2.jpg'),
    IMG('bathroom-3.jpg'),
    IMG('bathroom-4.jpg'),
    IMG('bathroom-5.jpg'),
    IMG('bathroom-6.jpg'),
  ],
  office: [
    IMG('office-1.jpg'),
    IMG('office-2.jpg'),
    IMG('office-3.jpg'),
    IMG('office-4.jpg'),
    IMG('office-5.jpg'),
    IMG('office-6.jpg'),
  ],
  land: [
    IMG('land-1.jpg'),
    IMG('land-2.jpg'),
    IMG('land-3.jpg'),
    IMG('land-4.jpg'),
    IMG('land-5.jpg'),
    IMG('land-6.jpg'),
    IMG('land-7.jpg'),
  ],
  shop: [
    IMG('shop-1.jpg'),
    IMG('shop-2.jpg'),
    IMG('shop-3.jpg'),
    IMG('shop-4.jpg'),
  ],
  warehouse: [
    IMG('warehouse-1.jpg'),
    IMG('warehouse-2.jpg'),
    IMG('warehouse-3.jpg'),
  ],
}
const E = IMAGES.apartmentExterior
const H = IMAGES.houseExterior
const LR = IMAGES.livingRoom
const BD = IMAGES.bedroom
const K = IMAGES.kitchen
const BT = IMAGES.bathroom
const OF = IMAGES.office
const L = IMAGES.land
const SH = IMAGES.shop
const WH = IMAGES.warehouse

const PROPERTY_SEED = [
  P({
    title: 'Modern 2 Bedroom Apartment in CMC',
    category: 'apartment', city: 'Addis Ababa', subArea: 'CMC',
    address: 'CMC Road, Near Sheger Park', price: 18000,
    bedrooms: 2, bathrooms: 2, area: 120,
    furnished: true, parking: true, elevator: true, waterTank: true, security: true,
    featured: true, views: 1450, postedAt: new Date('2026-08-04'),
    owner: MOCK_OWNERS[0],
    description: 'A bright and spacious two-bedroom apartment in the heart of CMC. Open-plan living, modern fitted kitchen, two bedrooms with built-in wardrobes and two bathrooms. 24/7 security, elevator, underground parking and generator backup.',
    images: [E[0], LR[0], BD[0], K[0], BT[0]],
  }),
  P({
    title: 'Luxury 4 Bedroom Villa with Garden',
    category: 'villa', city: 'Addis Ababa', subArea: 'Bole',
    address: 'Bole Michael, Bole Road', price: 85000,
    bedrooms: 4, bathrooms: 5, area: 420,
    furnished: true, parking: true, waterTank: true, security: true,
    featured: true, views: 2310, postedAt: new Date('2026-07-28'),
    owner: MOCK_OWNERS[3],
    description: 'An exquisite villa in the prestigious Bole Michael area. Large compound with landscaped garden, private pool and parking for four cars. Elegantly furnished with premium finishes and a fully equipped kitchen.',
    images: [H[0], LR[6], BD[1], K[2], BT[1]],
  }),
  P({
    title: 'Fully Furnished Studio Apartment',
    category: 'studio', city: 'Addis Ababa', subArea: 'Saris',
    address: 'Saris, Adey Abeba Street', price: 9000,
    bedrooms: 1, bathrooms: 1, area: 45,
    furnished: true, elevator: true, security: true,
    featured: true, views: 980, postedAt: new Date('2026-08-02'),
    owner: MOCK_OWNERS[4],
    description: 'A cozy, fully furnished studio ideal for young professionals. Comfortable bed, wardrobe, work desk, kitchenette and modern bathroom. Reception, elevator and cleaning service. Close to Bole and the airport.',
    images: [E[1], LR[2], BD[2], K[1], BT[2]],
  }),
  P({
    title: '3 Bedroom Family House in Ayat',
    category: 'house', city: 'Addis Ababa', subArea: 'Ayat',
    address: 'Ayat 02, Near Ayat Mini Stadium', price: 30000,
    bedrooms: 3, bathrooms: 3, area: 250,
    parking: true, waterTank: true, security: true,
    featured: true, views: 1120, postedAt: new Date('2026-07-30'),
    owner: MOCK_OWNERS[1],
    description: 'A comfortable three-bedroom family house with a generous compound, garage and small garden. Spacious living room, dining area, kitchen with store room and three bedrooms with two full bathrooms.',
    images: [H[1], LR[1], BD[3], K[3], BT[3]],
  }),
  P({
    title: 'Office Space for Rent - 5th Floor',
    category: 'office', city: 'Addis Ababa', subArea: 'Kazanchis',
    address: 'Kazanchis Business District, Cameroon Street', price: 45000,
    bathrooms: 2, area: 180,
    furnished: true, parking: true, elevator: true, security: true, waterTank: true,
    featured: true, views: 860, postedAt: new Date('2026-08-05'),
    owner: MOCK_OWNERS[6],
    description: 'A premium office space on the fifth floor of a modern commercial building. Open layout with private offices, meeting room, reception area and two restrooms. 24/7 security, high-speed elevators and backup power.',
    images: [OF[0], OF[1], OF[2], OF[3]],
  }),
  P({
    title: 'Commercial Land Plot - Dukem',
    category: 'land', city: 'Adama', subArea: 'Dukem Road',
    address: 'Dukem Town, Along the Main Road', price: 60000,
    area: 1500,
    featured: true, views: 540, postedAt: new Date('2026-07-22'),
    owner: MOCK_OWNERS[5],
    description: 'A large commercial land plot of 1,500 sqm along the main road in Dukem town. Levelled, fenced and suitable for warehouse, showroom or light industrial development. Clear title deed available.',
    images: [L[0], L[1], L[2], L[3]],
  }),
  P({
    title: '2 Bedroom Apartment Near Marina, Bahir Dar',
    category: 'apartment', city: 'Bahir Dar', subArea: 'Maritime',
    address: 'Maritime Area, Near Lake Tana', price: 12000,
    bedrooms: 2, bathrooms: 1, area: 110,
    parking: true, waterTank: true,
    views: 430, postedAt: new Date('2026-08-03'),
    owner: MOCK_OWNERS[2],
    description: 'A lovely two-bedroom apartment in the Maritime area of Bahir Dar, a short walk from Lake Tana. Lake view from the balcony, spacious living room and functional kitchen.',
    images: [E[2], LR[3], BD[5], K[4], BT[4]],
  }),
  P({
    title: 'Gated 2 Bedroom House in Adama',
    category: 'house', city: 'Adama', subArea: 'Bati',
    address: 'Bati Junction, Gated Community', price: 10000,
    bedrooms: 2, bathrooms: 2, area: 150,
    parking: true, security: true, waterTank: true,
    views: 310, postedAt: new Date('2026-07-26'),
    owner: MOCK_OWNERS[7],
    description: 'A clean two-bedroom house inside a quiet gated community in Adama. Two bedrooms, two bathrooms, combined living and dining area, kitchen with a store. Parking, water tank and a shared garden.',
    images: [H[2], LR[4], BD[4], K[5], BT[5]],
  }),
  P({
    title: 'Executive Villa with Lake View, Hawassa',
    category: 'villa', city: 'Hawassa', subArea: 'Tabor',
    address: 'Tabor Hill, Lake View Area', price: 40000,
    bedrooms: 3, bathrooms: 3, area: 300,
    furnished: true, parking: true, waterTank: true, security: true,
    views: 720, postedAt: new Date('2026-07-29'),
    owner: MOCK_OWNERS[0],
    description: 'An executive three-bedroom villa on Tabor Hill with stunning views of Lake Hawassa. Spacious living area, modern kitchen, three en-suite bedrooms and a terrace overlooking the lake.',
    images: [H[3], LR[7], BD[1], K[0], BT[0]],
  }),
  P({
    title: 'Retail Shop for Rent - Piassa',
    category: 'shop', city: 'Addis Ababa', subArea: 'Piassa',
    address: 'Piassa, Bank of Abyssinia Building', price: 55000,
    bathrooms: 1, area: 60,
    elevator: true, security: true,
    views: 605, postedAt: new Date('2026-07-31'),
    owner: MOCK_OWNERS[3],
    description: 'A prime retail shop on the ground floor of a busy commercial building in Piassa. High foot traffic, ideal for clothing, electronics or food retail. Includes one restroom and shared security.',
    images: [SH[0], SH[1], SH[2], SH[3]],
  }),
  P({
    title: 'Warehouse - Modjo Dry Port Road',
    category: 'warehouse', city: 'Adama', subArea: 'Modjo',
    address: 'Modjo, Along Dry Port Road', price: 95000,
    bathrooms: 2, area: 800,
    parking: true, security: true,
    views: 389, postedAt: new Date('2026-07-18'),
    owner: MOCK_OWNERS[5],
    description: 'A large warehouse of 800 sqm along the Modjo Dry Port road with easy truck access. High ceiling, loading bay, office room, restrooms and a guarded compound.',
    images: [WH[0], WH[1], WH[2], OF[4]],
  }),
  P({
    title: 'One Bedroom Apartment, Megenagna',
    category: 'apartment', city: 'Addis Ababa', subArea: 'Megenagna',
    address: 'Megenagna, Near Edna Mall', price: 14000,
    bedrooms: 1, bathrooms: 1, area: 75,
    furnished: true, elevator: true, parking: true, security: true, waterTank: true,
    views: 880, postedAt: new Date('2026-08-06'),
    owner: MOCK_OWNERS[1],
    description: 'A modern one-bedroom apartment in central Megenagna, minutes from Edna Mall and the light rail. Fully furnished, separate kitchen, balcony and one parking spot.',
    images: [E[3], LR[5], BD[0], K[1], BT[1]],
  }),
  P({
    title: 'Spacious 3 Bedroom House in Gerji',
    category: 'house', city: 'Addis Ababa', subArea: 'Gerji',
    address: 'Gerji, Behind Gerji Church', price: 26000,
    bedrooms: 3, bathrooms: 2, area: 210,
    parking: true, waterTank: true,
    views: 540, postedAt: new Date('2026-08-01'),
    owner: MOCK_OWNERS[4],
    description: 'A spacious three-bedroom house in the family-friendly neighbourhood of Gerji. Large living room, dining area, modern kitchen and a big compound with garden and parking.',
    images: [H[4], LR[2], BD[1], K[2], BT[2]],
  }),
  P({
    title: 'Open Land Plot in Jiren, Jimma',
    category: 'land', city: 'Jimma', subArea: 'Jiren',
    address: 'Jiren Area, Off the Main Road', price: 8000,
    area: 500,
    views: 205, postedAt: new Date('2026-07-24'),
    owner: MOCK_OWNERS[6],
    description: 'An open land plot of 500 sqm in the growing area of Jiren, Jimma. Suitable for residential construction in a developing neighbourhood. Flexible rent with annual payment options.',
    images: [L[4], L[5], L[6], L[0]],
  }),
  P({
    title: 'Furnished Office - CMC Tower',
    category: 'office', city: 'Addis Ababa', subArea: 'CMC',
    address: 'CMC, Gurd Shola Tower', price: 35000,
    bathrooms: 1, area: 140,
    furnished: true, parking: true, elevator: true, security: true, waterTank: true,
    views: 415, postedAt: new Date('2026-08-06'),
    owner: MOCK_OWNERS[7],
    description: 'A fully furnished office unit in the CMC Gurd Shola Tower. Workstations, meeting room and reception desk. 24/7 security, two elevators and a backup generator.',
    images: [OF[4], OF[5], OF[1], OF[2]],
  }),
  P({
    title: 'Single Room for Rent in Bole',
    category: 'room', city: 'Addis Ababa', subArea: 'Bole',
    address: 'Bole, Medhanialem Area', price: 6500,
    bedrooms: 1, bathrooms: 1, area: 22,
    furnished: true, waterTank: true, security: true,
    views: 268, postedAt: new Date('2026-08-05'),
    owner: MOCK_OWNERS[2],
    description: 'A clean, furnished single room in the Bole area, ideal for students or young professionals. Shared bathroom, kitchen access, reliable water and 24/7 security at the compound gate. Five minutes walk to the main Bole Road.',
    images: [BD[2], BD[4], LR[6], BT[2]],
  }),
  P({
    title: 'Room near Campus - Adama',
    category: 'room', city: 'Adama', subArea: 'Bati',
    address: 'Bati, Near Adama University', price: 3500,
    bedrooms: 1, bathrooms: 1, area: 18,
    furnished: false, waterTank: true,
    views: 174, postedAt: new Date('2026-07-27'),
    owner: MOCK_OWNERS[6],
    description: 'An affordable room near Adama University with easy access to the campus gate. Shared facilities, solar backup, and a quiet compound. Perfect for students and interns. Flexible short-term rental available.',
    images: [BD[3], BD[0], LR[1], BT[1]],
  }),
  P({
    title: 'Commercial Space - Mexico Square',
    category: 'commercial', city: 'Addis Ababa', subArea: 'Mexico',
    address: 'Mexico Square, Near Balcha Hospital', price: 75000,
    bathrooms: 2, area: 320,
    parking: true, security: true, elevator: true,
    views: 502, postedAt: new Date('2026-08-03'),
    owner: MOCK_OWNERS[1],
    description: 'A versatile commercial space on the first floor of a busy building at Mexico Square. High visibility with large street-facing windows. Ideal for a showroom, clinic, bank branch or office. Includes 24/7 security and a dedicated parking bay.',
    images: [OF[0], OF[2], SH[0], OF[3]],
  }),
  P({
    title: 'Warehouse & Showroom Complex - Bole',
    category: 'commercial', city: 'Addis Ababa', subArea: 'Bole',
    address: 'Bole Bulbula, Near Ring Road', price: 120000,
    bathrooms: 2, area: 950,
    parking: true, security: true, waterTank: true,
    views: 611, postedAt: new Date('2026-08-06'),
    owner: MOCK_OWNERS[5],
    description: 'A combined warehouse and showroom complex in the Bole Bulbula area with truck access from the Ring Road. High ceilings, wide loading bay, showroom frontage and a gated, guarded compound. Suitable for distribution and retail hubs.',
    images: [WH[0], WH[1], OF[1], OF[3]],
  }),
]

const DEMO_EMAILS = ['demo@alpharent.com', 'owner@alpharent.com', 'admin@alpharent.com']

async function wipe() {
  const results = await Promise.all([
    RentalRequest.deleteMany({}),
    ViewingRequest.deleteMany({}),
    RentalAgreement.deleteMany({}),
    Message.deleteMany({}),
    Notification.deleteMany({}),
    Favorite.deleteMany({}),
    Property.deleteMany({}),
    User.deleteMany({ email: { $in: DEMO_EMAILS } }),
  ])
  console.log(`Cleared managed collections (${results.reduce((sum, r) => sum + r.deletedCount, 0)} documents removed). Registered user accounts are preserved.`)
}

async function seedUsers() {
  const [admin] = await Promise.all([
    User.create({
      name: 'Alpha Admin',
      email: adminEmail,
      password: adminPassword,
      phone: '+251 900 000 000',
      role: 'admin',
      avatarSeed: 1,
      verified: true,
      responseRate: 100,
    }),
  ])
  console.log('Admin user created. No demo tenant/owner accounts are seeded — every user registers their own account.')
  return { admin }
}

async function seedProperties() {
  const properties = []
  for (const seed of PROPERTY_SEED) {
    const o = seed.owner
    const property = await Property.create({
      title: seed.title,
      description: seed.description,
      category: seed.category,
      city: seed.city,
      subArea: seed.subArea,
      address: seed.address,
      price: seed.price,
      bedrooms: seed.bedrooms,
      bathrooms: seed.bathrooms,
      area: seed.area,
      furnished: seed.furnished,
      parking: seed.parking,
      security: seed.security,
      waterTank: seed.waterTank,
      elevator: seed.elevator,
      featured: seed.featured,
      views: seed.views,
      status: 'available',
      approvalStatus: 'approved',
      postedAt: seed.postedAt,
      images: seed.images || [],
      owner: null,
      ownerName: o.name,
      ownerPhone: o.phone,
      ownerEmail: o.email,
      ownerVerified: true,
      ownerResponseRate: 90 + (properties.length % 2 === 0 ? 5 : 0),
      ownerJoinedAt: new Date('2022-01-01'),
    })
    properties.push(property)
  }
  console.log(`Properties created: ${properties.length}`)
  return properties
}

async function main() {
  try {
    await connectDB()

    if (DELETE_ONLY) {
      await wipe()
      console.log('Database cleared. Nothing seeded.')
      await disconnectDB()
      return
    }

    await wipe()
    await seedUsers()
    await seedProperties()

    console.log('\nSeed complete!')
    console.log(`  Admin       : ${adminEmail} / ${adminPassword}`)
    console.log('  Properties  : 19')
    await disconnectDB()
  } catch (err) {
    console.error('Seed failed:', err.message)
    process.exitCode = 1
  }
}

main()
