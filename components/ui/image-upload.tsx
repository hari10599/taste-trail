'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, X, ImageIcon, Loader2, AlertCircle } from 'lucide-react'
import { validateImageFile } from '@/lib/imagekit'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onUpload: (files: File[]) => Promise<void>
  onRemove?: (index: number) => void
  maxFiles?: number
  existingImages?: string[]
  className?: string
  disabled?: boolean
  accept?: string
  placeholder?: string
}

export function ImageUpload({
  onUpload,
  onRemove,
  maxFiles = 10,
  existingImages = [],
  className,
  disabled = false,
  accept = 'image/*',
  placeholder = 'Drag and drop images here, or click to select files'
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (disabled) return
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    if (disabled) return
    
    setError(null)
    
    // Check file count limit
    if (existingImages.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed`)
      return
    }
    
    // Validate each file
    const validFiles: File[] = []
    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        setError(validation.error || 'Invalid file')
        return
      }
      validFiles.push(file)
    }
    
    if (validFiles.length === 0) return
    
    setIsUploading(true)
    try {
      await onUpload(validFiles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [disabled, existingImages.length, maxFiles, onUpload])

  const handleRemove = useCallback((index: number) => {
    if (onRemove) {
      onRemove(index)
    }
  }, [onRemove])

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [disabled])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            {isUploading ? (
              <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {isUploading ? 'Uploading...' : placeholder}
              </p>
              <p className="text-xs text-gray-500">
                {maxFiles > 1 ? `Up to ${maxFiles} files` : 'Single file'} • 
                JPEG, PNG, WebP • Max 5MB each
              </p>
            </div>
            
            {!isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  openFileDialog()
                }}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Select Files
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Preview Grid */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {existingImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Count */}
      {existingImages.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {existingImages.length} of {maxFiles} images
        </p>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled}
      />
    </div>
  )
}