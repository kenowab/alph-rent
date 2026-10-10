/**
 * City metadata mirrored from the frontend (src/data/meta.js) so that the
 * API can accept either a city id (e.g. `addis-ababa`) or a city name.
 */
export const CITIES = [
  { id: 'addis-ababa', name: 'Addis Ababa', subAreas: ['Bole', 'CMC', 'Piassa', 'Megenagna', 'Gerji', 'Saris', 'Kazanchis', 'Ayat', 'Summit', 'Gofa'] },
  { id: 'adama', name: 'Adama', subAreas: ['Downtown', 'Bati', 'Dukem Road'] },
  { id: 'bahir-dar', name: 'Bahir Dar', subAreas: ['Kebele 14', 'Atse Tewodros', 'Maritime'] },
  { id: 'dire-dawa', name: 'Dire Dawa', subAreas: ['Kefira', 'Lafto', 'Melka Jebdu'] },
  { id: 'hawassa', name: 'Hawassa', subAreas: ['Adare', 'Tabor', 'Menen'] },
  { id: 'mekelle', name: 'Mekelle', subAreas: ['Ayder', 'Kaliti', 'Gondar Meskel'] },
  { id: 'jimma', name: 'Jimma', subAreas: ['Jiren', 'Hermata', 'Mendi'] },
  { id: 'gondar', name: 'Gondar', subAreas: ['Arada', 'Fasil', 'Piasa'] },
  { id: 'debre-markos', name: 'Debre Markos', subAreas: ['Downtown'] },
  { id: 'harar', name: 'Harar', subAreas: ['Jugol', 'Old Town'] },
]

export const CITY_ID_TO_NAME = Object.fromEntries(CITIES.map((c) => [c.id, c.name]))

/** Normalize a city filter value: id → name, otherwise pass through. */
export function normalizeCity(value) {
  if (!value || value === 'all') return null
  return CITY_ID_TO_NAME[value] || value
}
