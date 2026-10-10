// Curated pool of property photos stored locally in /public/images/properties.
// Sources: Unsplash (free for commercial & personal use — unsplash.com/license).
// Using local copies so images always display, even without internet.
// Used by the static demo properties in src/data/properties.js.
// Uploaded owner images are never replaced — these are only the demo defaults.

const local = (name) => `/images/properties/${name}`

// Exactly 60 local photos across different property scenes.
export const PROPERTY_IMAGES = [
  // House exteriors (6)
  local('house-1.jpg'),
  local('house-2.jpg'),
  local('house-3.jpg'),
  local('house-4.jpg'),
  local('house-5.jpg'),
  local('house-6.jpg'),
  // Apartment exteriors (5)
  local('apartment-1.jpg'),
  local('apartment-2.jpg'),
  local('apartment-3.jpg'),
  local('apartment-4.jpg'),
  local('apartment-5.jpg'),
  // Villa exteriors (1)
  local('villa-1.jpg'),
  // Living rooms (8)
  local('livingroom-1.jpg'),
  local('livingroom-2.jpg'),
  local('livingroom-3.jpg'),
  local('livingroom-4.jpg'),
  local('livingroom-5.jpg'),
  local('livingroom-6.jpg'),
  local('livingroom-7.jpg'),
  local('livingroom-8.jpg'),
  // Bedrooms (6)
  local('bedroom-1.jpg'),
  local('bedroom-2.jpg'),
  local('bedroom-3.jpg'),
  local('bedroom-4.jpg'),
  local('bedroom-5.jpg'),
  local('bedroom-6.jpg'),
  // Kitchens (6)
  local('kitchen-1.jpg'),
  local('kitchen-2.jpg'),
  local('kitchen-3.jpg'),
  local('kitchen-4.jpg'),
  local('kitchen-5.jpg'),
  local('kitchen-6.jpg'),
  // Bathrooms (6)
  local('bathroom-1.jpg'),
  local('bathroom-2.jpg'),
  local('bathroom-3.jpg'),
  local('bathroom-4.jpg'),
  local('bathroom-5.jpg'),
  local('bathroom-6.jpg'),
  // Offices (6)
  local('office-1.jpg'),
  local('office-2.jpg'),
  local('office-3.jpg'),
  local('office-4.jpg'),
  local('office-5.jpg'),
  local('office-6.jpg'),
  // Land / garden (7)
  local('land-1.jpg'),
  local('land-2.jpg'),
  local('land-3.jpg'),
  local('land-4.jpg'),
  local('land-5.jpg'),
  local('land-6.jpg'),
  local('land-7.jpg'),
  // Shops (4)
  local('shop-1.jpg'),
  local('shop-2.jpg'),
  local('shop-3.jpg'),
  local('shop-4.jpg'),
  // Warehouses (3)
  local('warehouse-1.jpg'),
  local('warehouse-2.jpg'),
  local('warehouse-3.jpg'),
  // Commercial (1)
  local('commercial-1.jpg'),
]

// Semantic groups for building property galleries.
export const IMAGES = {
  houseExterior: PROPERTY_IMAGES.slice(0, 6),
  apartmentExterior: PROPERTY_IMAGES.slice(6, 11),
  villaExterior: PROPERTY_IMAGES.slice(11, 12),
  livingRoom: PROPERTY_IMAGES.slice(12, 20),
  bedroom: PROPERTY_IMAGES.slice(20, 26),
  kitchen: PROPERTY_IMAGES.slice(26, 32),
  bathroom: PROPERTY_IMAGES.slice(32, 38),
  office: PROPERTY_IMAGES.slice(38, 44),
  land: PROPERTY_IMAGES.slice(44, 51),
  shop: PROPERTY_IMAGES.slice(51, 55),
  warehouse: PROPERTY_IMAGES.slice(55, 58),
  commercial: PROPERTY_IMAGES.slice(58, 59),
}

// Old database records reference images.unsplash.com. Map those photo ids to the
// local copies so listings always show an image, even without internet.
const UNSPLASH_TO_LOCAL = {
  'photo-1512917774080-9991f1c4c750': 'house-1.jpg',
  'photo-1564013799919-ab600027ffc6': 'house-2.jpg',
  'photo-1570129477492-45c003edd2be': 'house-3.jpg',
  'photo-1580587771525-78b9dba3b914': 'house-4.jpg',
  'photo-1600585154340-be6161a56a0c': 'house-5.jpg',
  'photo-1600607687939-ce8a6c25118c': 'house-6.jpg',
  'photo-1545324418-cc1a3fa10c00': 'apartment-1.jpg',
  'photo-1567496898669-ee935f5f647a': 'apartment-2.jpg',
  'photo-1613977257363-707ba9348227': 'apartment-3.jpg',
  'photo-1502672260266-1c1ef2d93688': 'apartment-4.jpg',
  'photo-1568605114967-8130f3a36994': 'apartment-5.jpg',
  'photo-1613490493576-7fde63acd811': 'villa-1.jpg',
  'photo-1486406146926-c627a92ad1ab': 'commercial-1.jpg',
  'photo-1560448204-e02f11c3d0e2': 'livingroom-1.jpg',
  'photo-1493809842364-78817add7ffb': 'livingroom-2.jpg',
  'photo-1522708323590-d24dbb6b0267': 'livingroom-3.jpg',
  'photo-1586023492125-27b2c045efd7': 'livingroom-4.jpg',
  'photo-1598928506311-c55ded91a20c': 'livingroom-5.jpg',
  'photo-1554995207-c18c203602cb': 'livingroom-6.jpg',
  'photo-1493663284031-b7e3aefcae8e': 'livingroom-7.jpg',
  'photo-1615873968403-89e068629265': 'livingroom-8.jpg',
  'photo-1567016432779-094069958ea5': 'bedroom-1.jpg',
  'photo-1522771739844-6a9f6d5f14af': 'bedroom-2.jpg',
  'photo-1505693416388-ac5ce068fe85': 'bedroom-3.jpg',
  'photo-1540518614846-7eded433c457': 'bedroom-4.jpg',
  'photo-1595526114035-0d45ed16cfbf': 'bedroom-5.jpg',
  'photo-1590490360182-c33d57733427': 'bedroom-6.jpg',
  'photo-1556911220-bff31c812dba': 'kitchen-1.jpg',
  'photo-1484154218962-a197022b5858': 'kitchen-2.jpg',
  'photo-1565538810643-b5bdb714032a': 'kitchen-3.jpg',
  'photo-1571508601891-ca5e7a713859': 'kitchen-4.jpg',
  'photo-1556909114-f6e7ad7d3136': 'kitchen-5.jpg',
  'photo-1581078426770-6d336e5de7bf': 'kitchen-6.jpg',
  'photo-1552321554-5fefe8c9ef14': 'bathroom-1.jpg',
  'photo-1584622650111-993a426fbf0a': 'bathroom-2.jpg',
  'photo-1620626011761-996317b8d101': 'bathroom-3.jpg',
  'photo-1507652313519-d4e9174996dd': 'bathroom-4.jpg',
  'photo-1585412727339-54e4bae3bbf9': 'bathroom-5.jpg',
  'photo-1585128792020-803d29415281': 'bathroom-6.jpg',
  'photo-1497366216548-37526070297c': 'office-1.jpg',
  'photo-1497366811353-6870744d04b2': 'office-2.jpg',
  'photo-1524758631624-e2822e304c36': 'office-3.jpg',
  'photo-1576941089067-2de3c901e126': 'office-4.jpg',
  'photo-1497215728101-856f4ea42174': 'office-5.jpg',
  'photo-1541746972996-4e0b0f43e02a': 'office-6.jpg',
  'photo-1500382017468-9049fed747ef': 'land-1.jpg',
  'photo-1470071459604-3b5ec3a7fe05': 'land-2.jpg',
  'photo-1416339306562-f3d12fefd36f': 'land-3.jpg',
  'photo-1501785888041-af3ef285b470': 'land-4.jpg',
  'photo-1472214103451-9374bd1c798e': 'land-5.jpg',
  'photo-1441974231531-c6227db76b6e': 'land-6.jpg',
  'photo-1464822759023-fed622ff2c3b': 'land-7.jpg',
  'photo-1441986300917-64674bd600d8': 'shop-1.jpg',
  'photo-1534452203293-494d7ddbf7e0': 'shop-2.jpg',
  'photo-1567401893414-76b7b1e5a7a5': 'shop-3.jpg',
  'photo-1604719312566-8912e9227c6a': 'shop-4.jpg',
  'photo-1586528116311-ad8dd3c8310d': 'warehouse-1.jpg',
  'photo-1553413077-190dd305871c': 'warehouse-2.jpg',
  'photo-1587293852726-70cdb56c2866': 'warehouse-3.jpg',
}

// Resolves any image source to a local file when possible.
export function localImage(src) {
  if (typeof src !== 'string' || !src) return src
  const match = src.match(/images\.unsplash\.com\/(photo-[\w-]+)/)
  if (!match) return src
  const file = UNSPLASH_TO_LOCAL[match[1]]
  return file ? `/images/properties/${file}` : src
}
