'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Images, Search, Filter, Download, Trash2, Eye,
  Grid3X3, List, SortAsc, SortDesc, Calendar,
  FileText, FolderOpen, Tag
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface GalleryImage {
  id: string
  fileId: string
  fileName: string
  originalName: string
  url: string
  thumbnailUrl?: string
  mimeType: string
  size: number
  width?: number
  height?: number
  folder: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface ImageGalleryProps {
  className?: string
  onSelect?: (images: GalleryImage[]) => void
  selectable?: boolean
  maxSelection?: number
  folder?: string
  allowDelete?: boolean
  showUpload?: boolean
}

export function ImageGallery({
  className,
  onSelect,
  selectable = false,
  maxSelection = 1,
  folder,
  allowDelete = false,
  showUpload = false
}: ImageGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [folderFilter, setFolderFilter] = useState(folder || 'all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [folders, setFolders] = useState<string[]>([])

  useEffect(() => {
    fetchImages()
    fetchFolders()
  }, [page, folderFilter, sortBy, sortOrder])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setPage(1)
      fetchImages()
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(folderFilter !== 'all' && { folder: folderFilter })
      })

      const response = await axios.get(`/api/media/gallery?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setImages(response.data.images)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch images:', error)
      toast.error('Failed to load gallery')
    } finally {
      setLoading(false)
    }
  }

  const fetchFolders = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.get('/api/media/folders', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFolders(response.data.folders)
    } catch (error) {
      console.error('Failed to fetch folders:', error)
    }
  }

  const handleImageSelect = (imageId: string) => {
    if (!selectable) return

    setSelectedImages(prev => {
      const isSelected = prev.includes(imageId)
      
      if (isSelected) {
        return prev.filter(id => id !== imageId)
      } else {
        if (maxSelection === 1) {
          return [imageId]
        } else if (prev.length < maxSelection) {
          return [...prev, imageId]
        } else {
          toast.error(`Maximum ${maxSelection} images can be selected`)
          return prev
        }
      }
    })
  }

  const handleDelete = async (imageId: string) => {
    if (!allowDelete) return

    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      const token = localStorage.getItem('accessToken')
      await axios.delete(`/api/media/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setImages(prev => prev.filter(img => img.id !== imageId))
      setSelectedImages(prev => prev.filter(id => id !== imageId))
      toast.success('Image deleted successfully')
    } catch (error) {
      console.error('Failed to delete image:', error)
      toast.error('Failed to delete image')
    }
  }

  const handleSelectConfirm = () => {
    if (onSelect && selectedImages.length > 0) {
      const selected = images.filter(img => selectedImages.includes(img.id))
      onSelect(selected)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const GridView = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className={cn(
            'relative group cursor-pointer border rounded-lg overflow-hidden transition-all',
            selectable && selectedImages.includes(image.id) 
              ? 'ring-2 ring-primary border-primary' 
              : 'border-gray-200 hover:border-gray-300'
          )}
          onClick={() => selectable ? handleImageSelect(image.id) : setPreviewImage(image.url)}
        >
          <div className="aspect-square relative bg-gray-100">
            <Image
              src={image.thumbnailUrl || image.url}
              alt={image.originalName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setPreviewImage(image.url)
                }}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {allowDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(image.id)
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Selection indicator */}
            {selectable && (
              <div className="absolute top-2 left-2">
                <div className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center',
                  selectedImages.includes(image.id)
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-gray-300'
                )}>
                  {selectedImages.includes(image.id) && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Image info */}
          <div className="p-2">
            <p className="text-xs font-medium text-gray-700 truncate">
              {image.originalName}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>{formatFileSize(image.size)}</span>
              {image.width && image.height && (
                <span>{image.width}×{image.height}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const ListView = () => (
    <div className="space-y-2">
      {images.map((image) => (
        <div
          key={image.id}
          className={cn(
            'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all',
            selectable && selectedImages.includes(image.id)
              ? 'ring-2 ring-primary border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          )}
          onClick={() => selectable ? handleImageSelect(image.id) : setPreviewImage(image.url)}
        >
          {/* Thumbnail */}
          <div className="w-16 h-16 relative bg-gray-100 rounded overflow-hidden flex-shrink-0">
            <Image
              src={image.thumbnailUrl || image.url}
              alt={image.originalName}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{image.originalName}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
              <span>{formatFileSize(image.size)}</span>
              {image.width && image.height && (
                <span>{image.width}×{image.height}</span>
              )}
              <span className="flex items-center gap-1">
                <FolderOpen className="h-3 w-3" />
                {image.folder}
              </span>
              <span>{formatDistanceToNow(new Date(image.createdAt), { addSuffix: true })}</span>
            </div>
            {image.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {image.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {image.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{image.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectable && (
              <div className={cn(
                'w-5 h-5 rounded border-2 flex items-center justify-center',
                selectedImages.includes(image.id)
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-gray-300'
              )}>
                {selectedImages.includes(image.id) && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setPreviewImage(image.url)
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {allowDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(image.id)
                }}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )

  if (loading && images.length === 0) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Images className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold">Image Gallery</h3>
          {selectable && selectedImages.length > 0 && (
            <Badge variant="outline">
              {selectedImages.length} selected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search images by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Folder Filter */}
            <Select value={folderFilter} onValueChange={setFolderFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All folders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Folders</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder} value={folder}>
                    {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: 'date' | 'name' | 'size') => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selection Actions */}
      {selectable && selectedImages.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm text-primary font-medium">
            {selectedImages.length} image(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedImages([])}
            >
              Clear Selection
            </Button>
            <Button size="sm" onClick={handleSelectConfirm}>
              Use Selected
            </Button>
          </div>
        </div>
      )}

      {/* Images */}
      {images.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Images className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No images found</p>
            <p className="text-sm text-gray-400">Upload some images to get started</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'grid' ? <GridView /> : <ListView />}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" 
          onClick={() => setPreviewImage(null)}
        >
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
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}