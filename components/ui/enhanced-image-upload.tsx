'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, X, ImageIcon, Loader2, AlertCircle, 
  Eye, Download, RotateCcw, Crop, Palette, 
  Maximize2, Settings
} from 'lucide-react'
import { validateImageFile } from '@/lib/imagekit'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import axios from 'axios'
import toast from 'react-hot-toast'

interface UploadedImage {
  id?: string
  fileId?: string
  url: string
  thumbnailUrl?: string
  fileName: string
  originalName?: string
  size: number
  width?: number
  height?: number
  mimeType?: string
}

interface EnhancedImageUploadProps {
  onUpload?: (images: UploadedImage[]) => void
  onRemove?: (index: number) => void
  maxFiles?: number
  existingImages?: UploadedImage[]
  className?: string
  disabled?: boolean
  accept?: string
  placeholder?: string
  folder?: string
  tags?: string[]
  showPreview?: boolean
  showMetadata?: boolean
  allowTransformations?: boolean
  compressionQuality?: number
}

export function EnhancedImageUpload({
  onUpload,
  onRemove,
  maxFiles = 10,
  existingImages = [],
  className,
  disabled = false,
  accept = 'image/*',
  placeholder = 'Drag and drop images here, or click to select files',
  folder = 'general',
  tags = [],
  showPreview = true,
  showMetadata = true,
  allowTransformations = false,
  compressionQuality = 80
}: EnhancedImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [error, setError] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
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
      const formData = new FormData()
      
      validFiles.forEach(file => {
        formData.append('files', file)
      })
      
      formData.append('folder', folder)
      formData.append('tags', JSON.stringify(tags))
      
      if (compressionQuality !== 80) {
        formData.append('transformation', JSON.stringify({
          quality: compressionQuality,
          format: 'webp'
        }))
      }

      const token = localStorage.getItem('accessToken')
      const response = await axios.post('/api/media/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            setUploadProgress({ overall: percentCompleted })
          }
        }
      })

      const uploadedImages: UploadedImage[] = response.data.uploads.map((upload: any) => ({
        id: upload.id,
        fileId: upload.fileId,
        url: upload.url,
        thumbnailUrl: upload.thumbnailUrl,
        fileName: upload.fileName,
        originalName: upload.originalName,
        size: upload.size,
        width: upload.width,
        height: upload.height,
        mimeType: upload.mimeType
      }))

      if (onUpload) {
        onUpload(uploadedImages)
      }

      toast.success(`${uploadedImages.length} image(s) uploaded successfully`)
    } catch (err: any) {
      console.error('Upload error:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Upload failed'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress({})
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [disabled, existingImages.length, maxFiles, onUpload, folder, tags, compressionQuality])

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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCompressionBadge = (size: number) => {
    if (size > 2 * 1024 * 1024) { // > 2MB
      return <Badge variant="outline" className="text-red-600">Large</Badge>
    } else if (size > 500 * 1024) { // > 500KB
      return <Badge variant="outline" className="text-yellow-600">Medium</Badge>
    } else {
      return <Badge variant="outline" className="text-green-600">Optimized</Badge>
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer relative overflow-hidden',
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
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                {uploadProgress.overall && (
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress.overall}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress.overall}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {isUploading ? 'Uploading images...' : placeholder}
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                <span>{maxFiles > 1 ? `Up to ${maxFiles} files` : 'Single file'}</span>
                <span>•</span>
                <span>JPEG, PNG, WebP</span>
                <span>•</span>
                <span>Max 5MB each</span>
                {compressionQuality !== 80 && (
                  <>
                    <span>•</span>
                    <span>Quality: {compressionQuality}%</span>
                  </>
                )}
              </div>
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
        <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto h-auto p-1"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Preview Grid */}
      {showPreview && existingImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Images</h4>
            <span className="text-xs text-gray-500">
              {existingImages.length} of {maxFiles}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingImages.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden border">
                  <Image
                    src={image.thumbnailUrl || image.url}
                    alt={image.originalName || image.fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  
                  {/* Overlay with actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPreviewImage(image.url)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onRemove && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemove(index)}
                        className="h-8 w-8 p-0"
                        disabled={disabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* File size badge */}
                  <div className="absolute top-2 right-2">
                    {getCompressionBadge(image.size)}
                  </div>
                </div>

                {/* Metadata */}
                {showMetadata && (
                  <div className="mt-2 space-y-1">
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {image.originalName || image.fileName}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatFileSize(image.size)}</span>
                      {image.width && image.height && (
                        <span>{image.width}×{image.height}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center p-4">
            <Image
              src={previewImage}
              alt="Preview"
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
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