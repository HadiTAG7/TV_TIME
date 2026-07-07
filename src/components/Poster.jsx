import { useState } from 'react'
import Icon from './Icon.jsx'

// Poster artwork: a real image when available (TMDB), otherwise a stylized
// gradient placeholder so the demo catalog still looks like a movie wall.
// Failed image loads fall back to the placeholder too.
export default function Poster({ item, className = '', showTitle = true, iconSize = 'text-5xl' }) {
  const [broken, setBroken] = useState(false)
  const title = item.name || item.title
  if (item.poster && !broken) {
    return (
      <img
        src={item.poster}
        alt={title}
        loading="lazy"
        onError={() => setBroken(true)}
        className={`w-full h-full object-cover ${className}`}
      />
    )
  }
  const [c1, c2] = item.grad || ['#232526', '#414345']
  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center ${className}`}
      style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)` }}
    >
      <Icon name={item.icon || 'movie'} className={`${iconSize} text-white/80`} />
      {showTitle && (
        <span className="text-white/90 font-bold leading-tight text-sm drop-shadow-md" dir="auto">
          {title}
        </span>
      )}
      {showTitle && item.year && (
        <span className="text-white/50 text-label-sm">{item.year}</span>
      )}
    </div>
  )
}
