import { useState } from 'react'
import PropTypes from 'prop-types'
import { placeholderSvgUrl } from '../utils/images'
import { localImage } from '../data/propertyImages'
import { getCategoryLabel } from './property/helpers'

export default function PropertyImage({ property, seed = 0, className = '', iconSize = 56 }) {
  const [failed, setFailed] = useState(false)
  const image = failed ? null : property.images?.find(Boolean)
  const src = localImage(
    image ||
      placeholderSvgUrl({
        label: property.title,
        category: property.category,
        seed,
      }),
  )

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${className}`}
      role="img"
      aria-label={property.title}
    >
      <img
        src={src}
        alt={property.title}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
        {getCategoryLabel(property.category)}
      </span>
    </div>
  )
}

PropertyImage.propTypes = {
  property: PropTypes.object.isRequired,
  seed: PropTypes.number,
  className: PropTypes.string,
  iconSize: PropTypes.number,
}
