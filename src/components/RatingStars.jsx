import Icon from './Icon.jsx'

export default function RatingStars({ value = 0, onChange, size = 'text-2xl' }) {
  return (
    <div className="flex gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(value === n ? 0 : n)}
          className="active:scale-90 transition-transform"
          aria-label={`${n} stars`}
        >
          <Icon
            name="star"
            filled={n <= value}
            className={`${size} ${n <= value ? 'text-primary-container' : 'text-white/25'}`}
          />
        </button>
      ))}
    </div>
  )
}
