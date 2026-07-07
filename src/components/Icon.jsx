export default function Icon({ name, filled = false, className = '', style }) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? 'filled' : ''} ${className}`}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}
