import { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { propertyImages, placeholderSvgUrl } from '../../utils/images'
import { localImage } from '../../data/propertyImages'
import Icon from '../ui/Icon'

function GalleryImage({ src, alt, className, onClick, onError }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onClick={onClick}
      onError={onError}
    />
  )
}

export default function PropertyImageGallery({ property }) {
  const images = property.images?.length ? property.images.filter(Boolean) : propertyImages(property, 4)
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState(() => new Set())

  const fallbackFor = (index) =>
    placeholderSvgUrl({
      label: property.title,
      category: property.category,
      seed: index,
    })

  const handleError = (index) => {
    setFailed((current) => {
      if (current.has(index)) return current
      const next = new Set(current)
      next.add(index)
      return next
    })
  }

  const resolvedImages = images
    .map((src, i) => localImage(failed.has(i) ? fallbackFor(i) : src))

  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length])

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-700 dark:bg-slate-900">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <GalleryImage
          src={resolvedImages[active]}
          alt={`${property.title} photo ${active + 1}`}
          className="h-full w-full object-cover animate-fade-in"
          onError={() => handleError(active)}
        />

        <button
          type="button"
          onClick={prev}
          className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white hover:scale-105"
          aria-label="Previous image"
        >
          <Icon name="chevronLeft" size={22} />
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white hover:scale-105"
          aria-label="Next image"
        >
          <Icon name="chevronRight" size={22} />
        </button>

        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          <Icon name="camera" size={14} />
          {active + 1} / {images.length}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-5">
        {resolvedImages.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            className={`relative aspect-[4/3] overflow-hidden rounded-xl transition ${
              active === i ? 'ring-2 ring-primary-600 ring-offset-1' : 'opacity-70 hover:opacity-100'
            }`}
            aria-label={`View image ${i + 1}`}
          >
            <GalleryImage src={src} alt="" className="h-full w-full object-cover" onError={() => handleError(i)} />
          </button>
        ))}
      </div>
    </div>
  )
}

PropertyImageGallery.propTypes = {
  property: PropTypes.object.isRequired,
}
