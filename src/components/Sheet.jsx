import Icon from './Icon.jsx'

// Bottom-sheet on mobile / centered dialog on desktop, frosted per design.
export default function Sheet({ open, onClose, children }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overlay-in flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="glass w-full md:max-w-2xl max-h-[92dvh] md:max-h-[85dvh] rounded-t-xl md:rounded-xl overflow-y-auto sheet-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 end-3 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center hover:bg-black/70 active:scale-90 transition-all"
          aria-label="close"
        >
          <Icon name="close" className="text-white text-xl" />
        </button>
        {children}
      </div>
    </div>
  )
}
