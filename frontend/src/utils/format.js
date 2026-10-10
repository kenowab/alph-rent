export function formatPrice(price) {
  if (price == null) return '—'
  return new Intl.NumberFormat('en-US').format(price) + ' ETB'
}

export function rentAmount(price, period = 'monthly') {
  if (price == null) return 0
  return period === 'yearly' ? Math.round(price * 12) : price
}

export function formatRent(price, period = 'monthly') {
  if (price == null) return '—'
  const label = period === 'yearly' ? '/yr' : '/mo'
  return `${new Intl.NumberFormat('en-US').format(rentAmount(price, period))} ETB${label}`
}

export function formatCompactPrice(price) {
  if (price == null) return '—'
  return `${price.toLocaleString('en-US')} ETB`
}

export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function timeAgo(dateString) {
  if (!dateString) return ''
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  const units = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 },
  ]
  for (const unit of units) {
    const count = Math.floor(seconds / unit.seconds)
    if (count >= 1) {
      return count === 1 ? `1 ${unit.name} ago` : `${count} ${unit.name}s ago`
    }
  }
  return 'just now'
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
