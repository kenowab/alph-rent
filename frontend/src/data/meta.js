export const CATEGORIES = [
  { id: 'house', label: 'House', icon: 'home' },
  { id: 'apartment', label: 'Apartment', icon: 'building' },
  { id: 'villa', label: 'Villa', icon: 'villa' },
  { id: 'office', label: 'Office', icon: 'briefcase' },
  { id: 'land', label: 'Land', icon: 'map' },
  { id: 'studio', label: 'Studio', icon: 'bed' },
  { id: 'shop', label: 'Shop', icon: 'store' },
  { id: 'warehouse', label: 'Warehouse', icon: 'box' },
  { id: 'room', label: 'Room', icon: 'door' },
  { id: 'commercial', label: 'Commercial Property', icon: 'building2' },
]

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

export const PRICE_RANGES = [
  { id: 'under-5000', label: 'Under 5,000 ETB', min: 0, max: 5000 },
  { id: '5000-10000', label: '5,000 - 10,000 ETB', min: 5000, max: 10000 },
  { id: '10000-20000', label: '10,000 - 20,000 ETB', min: 10000, max: 20000 },
  { id: '20000-40000', label: '20,000 - 40,000 ETB', min: 20000, max: 40000 },
  { id: '40000-80000', label: '40,000 - 80,000 ETB', min: 40000, max: 80000 },
  { id: 'above-80000', label: 'Above 80,000 ETB', min: 80000, max: null },
]

export const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest first' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'popular', label: 'Most popular' },
]

export const CITY_HIGHLIGHTS = [
  {
    city: 'Addis Ababa',
    count: '2,340 listings',
    tag: 'Capital',
    gradient: 'from-primary-500 to-primary-800',
  },
  {
    city: 'Adama',
    count: '412 listings',
    tag: 'Oromia',
    gradient: 'from-emerald-500 to-emerald-800',
  },
  {
    city: 'Bahir Dar',
    count: '287 listings',
    tag: 'Amhara',
    gradient: 'from-sky-500 to-sky-800',
  },
  {
    city: 'Hawassa',
    count: '198 listings',
    tag: 'Sidama',
    gradient: 'from-violet-500 to-violet-800',
  },
  {
    city: 'Dire Dawa',
    count: '164 listings',
    tag: 'Dire Dawa',
    gradient: 'from-rose-500 to-rose-800',
  },
  {
    city: 'Mekelle',
    count: '150 listings',
    tag: 'Tigray',
    gradient: 'from-amber-500 to-amber-800',
  },
]
