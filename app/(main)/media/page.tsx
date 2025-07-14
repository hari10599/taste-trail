'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnhancedImageUpload } from '@/components/ui/enhanced-image-upload'
import { ImageGallery } from '@/components/ui/image-gallery'
import { Badge } from '@/components/ui/badge'
import { Upload, Images, Settings } from 'lucide-react'

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

export default function MediaPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [selectedImages, setSelectedImages] = useState<UploadedImage[]>([])
  const [refreshGallery, setRefreshGallery] = useState(0)

  const handleUpload = (newImages: UploadedImage[]) => {
    setUploadedImages([...uploadedImages, ...newImages])
    // Trigger gallery refresh
    setRefreshGallery(prev => prev + 1)
  }

  const handleRemove = (index: number) => {
    const newImages = [...uploadedImages]
    newImages.splice(index, 1)
    setUploadedImages(newImages)
  }

  const handleGallerySelect = (images: UploadedImage[]) => {
    setSelectedImages(images)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Images className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Media Center</h1>
        </div>
        <p className="text-gray-600">
          Upload, manage, and organize your images with advanced features.
        </p>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Images className="h-4 w-4" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="selected" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Selected
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Images</CardTitle>
              <CardDescription>
                Upload multiple images with automatic optimization and organization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedImageUpload
                onUpload={handleUpload}
                onRemove={handleRemove}
                maxFiles={10}
                existingImages={uploadedImages}
                folder="media-center"
                tags={["media-center", "user-upload"]}
                showPreview={true}
                showMetadata={true}
                compressionQuality={85}
              />
            </CardContent>
          </Card>

          {/* Upload Examples */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Restaurant Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedImageUpload
                  onUpload={handleUpload}
                  maxFiles={5}
                  folder="restaurants"
                  tags={["restaurant", "food"]}
                  placeholder="Upload restaurant images"
                  compressionQuality={90}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Review Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedImageUpload
                  onUpload={handleUpload}
                  maxFiles={3}
                  folder="reviews"
                  tags={["review", "dish"]}
                  placeholder="Upload review images"
                  compressionQuality={80}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Profile Avatar</CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedImageUpload
                  onUpload={handleUpload}
                  maxFiles={1}
                  folder="avatars"
                  tags={["avatar", "profile"]}
                  placeholder="Upload profile picture"
                  compressionQuality={95}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Image Gallery</CardTitle>
              <CardDescription>
                Browse, search, and manage all your uploaded images.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageGallery
                key={refreshGallery}
                onSelect={handleGallerySelect}
                selectable={true}
                maxSelection={5}
                allowDelete={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Selected Images Tab */}
        <TabsContent value="selected" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Selected Images
                {selectedImages.length > 0 && (
                  <Badge variant="outline">
                    {selectedImages.length} selected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                View and manage your selected images.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedImages.length === 0 ? (
                <div className="text-center py-12">
                  <Images className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No images selected</p>
                  <p className="text-sm text-gray-400">
                    Use the Gallery tab to select images
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {selectedImages.length} image(s) selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedImages([])}
                      >
                        Clear Selection
                      </Button>
                      <Button size="sm">
                        Use Selected
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden border">
                          <img
                            src={image.thumbnailUrl || image.url}
                            alt={image.originalName || image.fileName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 truncate">
                            {image.originalName || image.fileName}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{Math.round(image.size / 1024)} KB</span>
                            {image.width && image.height && (
                              <span>{image.width}×{image.height}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}