import PropertyCard from './PropertyCard'

export default function PropertyGrid({ properties, columns = 3, onDelete }) {
  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns]

  return (
    <div className={`grid gap-5 ${gridClass}`}>
      {properties.map((property, index) => (
        <PropertyCard
          key={property.id}
          property={property}
          index={index}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
