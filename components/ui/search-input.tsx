'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  className?: string
  placeholder?: string
  isMobile?: boolean
}

export function SearchInput({ className, placeholder = 'Search...', isMobile }: SearchInputProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
      setQuery('')
      setIsExpanded(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('')
      setIsExpanded(false)
      inputRef.current?.blur()
    }
  }

  if (isMobile) {
    return (
      <form onSubmit={handleSearch} className={cn('relative', className)}>
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-9 pr-4"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </form>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-gray-600" />
        </button>
      ) : (
        <form onSubmit={handleSearch} className="relative">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!query) {
                setIsExpanded(false)
              }
            }}
            placeholder={placeholder}
            className="w-64 pl-9 pr-9"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setIsExpanded(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        </form>
      )}
    </div>
  )
}