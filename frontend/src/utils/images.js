const GRADIENTS = [
  ['#254deb', '#1e2f8a'],
  ['#0ea5e9', '#1e40af'],
  ['#8b5cf6', '#4c1d95'],
  ['#10b981', '#065f46'],
  ['#f59e0b', '#b45309'],
  ['#ef4444', '#991b1b'],
  ['#ec4899', '#831843'],
  ['#14b8a6', '#134e4a'],
]

const ICON_PATHS = {
  apartment:
    'M5 10l7-6 7 6v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V10zm4 9h6v-7H9v7z',
  house:
    'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z',
  villa:
    'M3 13L12 5l9 8M5 13v8h14v-8M9 21v-5h6v5',
  office:
    'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M8 8h8M8 12h8M8 16h5',
  land:
    'M3 20h18M6 16h.01M10 16h.01M14 16h.01M18 16h.01M6 12h.01M10 12h.01M14 12h.01M6 8h.01M10 8h.01M14 8h.01',
  studio:
    'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm7 3h4a1 1 0 0 1 0 2h-4a1 1 0 0 1 0-2z',
  shop:
    'M4 9l1-5h14l1 5M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9M4 9h16M9 21v-6h6v6',
  warehouse:
    'M3 20V8l9-4 9 4v12M3 12h18M3 16h18M8 20v-4M12 20v-4M16 20v-4',
  bed: 'M3 7h11v7H3M14 10h4a3 3 0 0 1 3 3v1H14M7 12a2 2 0 1 1 4 0 2 2 0 0 1-4 0z',
}

export function placeholderSvg({
  label,
  category = 'apartment',
  seed = 0,
  width = 800,
  height = 600,
}) {
  const [c1, c2] = GRADIENTS[seed % GRADIENTS.length]
  const path = ICON_PATHS[category] || ICON_PATHS.apartment
  const title = label || 'Alpha Rent Ethiopia'

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g${seed}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g${seed})"/>
  <rect width="800" height="600" fill="url(#glow)"/>
  <g fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="2">
    <circle cx="90" cy="90" r="26"/><circle cx="720" cy="120" r="14"/>
    <circle cx="660" cy="520" r="22"/><circle cx="120" cy="500" r="10"/>
  </g>
  <g transform="translate(340 190)" fill="rgba(255,255,255,0.92)">
    <path d="${path}"/>
  </g>
  <text x="400" y="420" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${title}</text>
  <text x="400" y="460" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">Alpha Rent Ethiopia</text>
</svg>`
}

export function placeholderSvgUrl({ label, category, seed, width, height }) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    placeholderSvg({ label, category, seed, width, height }),
  )}`
}

export function propertyImages(property, count = 4) {
  const title = property.title || ''
  const images = []
  for (let i = 0; i < count; i += 1) {
    images.push(
      placeholderSvgUrl({
        label: title,
        category: property.category,
        seed: property.id ? property.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + i : i,
      }),
    )
  }
  return images
}

export function avatarSvg(name, seed = 0) {
  const [c1, c2] = GRADIENTS[seed % GRADIENTS.length]
  const [first, second] = (name || '?')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
  const letters = (first || '?') + (second || '')
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs>
  <rect width="96" height="96" fill="url(#a)"/>
  <text x="48" y="58" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700" fill="#ffffff">${letters}</text>
</svg>`)}`
}

// Real coordinates for the supported cities (lat, lon). Used to place a
// property on the map when exact lat/lng are not stored on the record.
const CITY_COORDS = {
  'addis ababa': [9.03, 38.74],
  'adama': [8.54, 39.27],
  'bahir dar': [11.6, 37.39],
  'dire dawa': [9.59, 41.87],
  'hawassa': [7.05, 38.48],
  'mekelle': [13.5, 39.47],
  'jimma': [7.68, 36.83],
  'gondar': [12.6, 37.47],
  'debre markos': [10.35, 37.73],
  'harar': [9.31, 42.12],
}

const FALLBACK_COORDS = [9.03, 38.74]

export function getCityCoords(city) {
  if (!city) return null
  return CITY_COORDS[String(city).trim().toLowerCase()] || null
}

// Best-effort coordinates for a property: exact lat/lng > city coords > safe fallback.
export function propertyCoords(property) {
  if (property) {
    const lat = Number(property.lat)
    const lng = Number(property.lng)
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      return [lat, lng]
    }
    const cityCoords = getCityCoords(property.city)
    if (cityCoords) return cityCoords
  }
  return FALLBACK_COORDS
}

export function mapEmbedUrl(location, city, coords) {
  const [lat, lon] = coords || getCityCoords(city) || FALLBACK_COORDS
  const query = encodeURIComponent(`${location || ''} ${city || ''}, Ethiopia`)
  const span = 0.12
  const [left, bottom, right, top] = [lon - span, lat - span, lon + span, lat + span].map((v) => v.toFixed(4))
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}&q=${query}`
}

export function mapViewUrl(location, city, coords) {
  const [lat, lon] = coords || getCityCoords(city) || FALLBACK_COORDS
  const query = encodeURIComponent(`${location || ''} ${city || ''}, Ethiopia`)
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}&layers=N&q=${query}`
}
