import { avatarSvg } from '../../utils/images'

export default function Avatar({ name, seed = 0, size = 40, className = '', src = '' }) {
  return (
    <img
      src={src || avatarSvg(name, seed)}
      alt={name || 'User avatar'}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full object-cover ring-2 ring-white ${className}`}
      loading="lazy"
    />
  )
}
