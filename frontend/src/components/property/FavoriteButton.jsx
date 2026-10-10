import { useFavorites } from '../../context/FavoritesContext'
import { useToast } from '../../context/ToastContext'
import Icon from '../ui/Icon'

export default function FavoriteButton({ propertyId, size = 'md', className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const toast = useToast()
  const active = isFavorite(propertyId)

  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
  }

  const iconSizes = { sm: 16, md: 18, lg: 22 }

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(propertyId)
    toast[active ? 'info' : 'success'](
      active ? 'Removed from saved properties' : 'Added to your saved properties',
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? 'Remove from favorites' : 'Save to favorites'}
      aria-pressed={active}
      className={`grid place-items-center rounded-full shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 ${sizes[size]} ${
        active
          ? 'bg-red-500 text-white'
          : 'bg-white/95 text-slate-500 hover:bg-white hover:text-red-500'
      } ${className}`}
    >
      <Icon name={active ? 'heart-solid' : 'heart'} size={iconSizes[size]} />
    </button>
  )
}
