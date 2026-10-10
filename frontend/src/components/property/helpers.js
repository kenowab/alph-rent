import { CATEGORIES } from '../../data/meta'

const LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))

export function getCategoryLabel(id) {
  return LABELS[id] || 'Property'
}

export function getCategoryIcon(id) {
  return CATEGORIES.find((c) => c.id === id)?.icon || 'building'
}

export function getCityLabel(id) {
  if (!id || id === 'all') return 'All Ethiopia'
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
