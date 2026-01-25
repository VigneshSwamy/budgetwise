type CategoryIconData = {
  bg: string
  color: string
  icon: JSX.Element
}

export const getCategoryIcon = (category: string | null): CategoryIconData => {
  const value = (category || '').toLowerCase()
  if (value.includes('groc')) {
    return {
      bg: '#DFF5E6',
      color: '#0F7A4A',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <circle cx="8" cy="21" r="1.4" />
          <circle cx="19" cy="21" r="1.4" />
          <path
            d="M2 3h2l2.4 11.4a2 2 0 0 0 2 1.6h9.6a2 2 0 0 0 2-1.6L22 7H6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      ),
    }
  }
  if (value.includes('dining') || value.includes('coffee') || value.includes('food')) {
    return {
      bg: '#FFE9CC',
      color: '#C85A16',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <path
            d="M3 8h13v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path
            d="M16 9h2a3 3 0 1 1 0 6h-2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path
            d="M6 3v3M10 3v3M14 3v3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      ),
    }
  }
  if (value.includes('transport') || value.includes('uber') || value.includes('ride')) {
    return {
      bg: '#DDE9FF',
      color: '#1E54D9',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <path
            d="M5 11l1.6-4.5A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.5L19 11"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path
            d="M3 11h18v4a2 2 0 0 1-2 2h-1"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path
            d="M5 17H4a2 2 0 0 1-2-2v-4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <circle cx="7.5" cy="17" r="1.6" strokeWidth="1.6" />
          <circle cx="16.5" cy="17" r="1.6" strokeWidth="1.6" />
        </svg>
      ),
    }
  }
  if (value.includes('shopping')) {
    return {
      bg: '#F7DAF0',
      color: '#B42773',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <path
            d="M6 8V6a6 6 0 0 1 12 0v2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path
            d="M5 8h14l-1 12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      ),
    }
  }
  if (value.includes('entertain') || value.includes('movie') || value.includes('stream')) {
    return {
      bg: '#EADCFB',
      color: '#6B2BD9',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            strokeWidth="1.6"
          />
          <path
            d="M8 3v18M16 3v18M3 8h5M3 16h5M16 8h5M16 16h5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      ),
    }
  }
  if (value.includes('bill') || value.includes('utility')) {
    return {
      bg: '#E9EEF4',
      color: '#425466',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <path
            d="M6 2h9l3 3v17H6z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
          <path d="M9 10h6M9 14h6M9 18h4" strokeLinecap="round" strokeWidth="1.6" />
        </svg>
      ),
    }
  }
  if (value.includes('health') || value.includes('medical')) {
    return {
      bg: '#F8DADB',
      color: '#B0252C',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <path
            d="M12 21s-6.5-4.35-8.5-7.5A5 5 0 0 1 12 6a5 5 0 0 1 8.5 7.5C18.5 16.65 12 21 12 21z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      ),
    }
  }
  return {
    bg: '#E6EDF2',
    color: '#4B5563',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path
          d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
        <path
          d="M9 8h6M9 12h6M9 16h4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      </svg>
    ),
  }
}

export const CategoryIcon = ({
  category,
  className,
}: {
  category: string | null
  className?: string
}) => {
  const icon = getCategoryIcon(category)
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${className || ''}`}
      style={{ backgroundColor: icon.bg, color: icon.color }}
    >
      {icon.icon}
    </div>
  )
}
