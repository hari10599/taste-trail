import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  readonly = false,
}: StarRatingProps) {
  const [hoveredValue, setHoveredValue] = useState(0)
  
  const handleMouseEnter = (index: number) => {
    if (!readonly) {
      setHoveredValue(index)
    }
  }
  
  const handleMouseLeave = () => {
    setHoveredValue(0)
  }
  
  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index)
    }
  }
  
  const displayValue = hoveredValue || value
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1
        const isFilled = starValue <= displayValue
        
        return (
          <button
            key={index}
            type="button"
            disabled={readonly}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(starValue)}
            className={cn(
              'transition-all',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? 'fill-yellow-500 text-yellow-500'
                  : 'fill-transparent text-gray-300'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}