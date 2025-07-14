'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Image as ImageIcon, Download, Copy, Settings, 
  Loader2, CheckCircle, Crop, Palette, Maximize2 
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import axios from 'axios'
import toast from 'react-hot-toast'

interface ImageTransformerProps {
  imageId: string
  originalUrl: string
  fileName: string
  className?: string
}

interface TransformedUrls {
  [key: string]: string
}

const PRESET_TRANSFORMATIONS = [
  { key: 'thumbnail', label: 'Thumbnail (200×150)', description: 'Small preview image' },
  { key: 'small', label: 'Small (400×300)', description: 'Card/list view' },
  { key: 'medium', label: 'Medium (800×600)', description: 'Detail view' },
  { key: 'large', label: 'Large (1200×900)', description: 'Full screen' },
  { key: 'square_small', label: 'Square Small (200×200)', description: 'Avatar/profile' },
  { key: 'square_medium', label: 'Square Medium (400×400)', description: 'Feature image' },
  { key: 'banner', label: 'Banner (1200×400)', description: 'Header/hero' },
  { key: 'high_quality', label: 'High Quality (95%)', description: 'Premium quality' },
  { key: 'medium_quality', label: 'Medium Quality (80%)', description: 'Balanced size/quality' },
  { key: 'low_quality', label: 'Low Quality (60%)', description: 'Compressed for speed' },
  { key: 'jpeg', label: 'JPEG Format', description: 'Standard format' },
  { key: 'png', label: 'PNG Format', description: 'Lossless format' },
  { key: 'webp', label: 'WebP Format', description: 'Modern format' },
  { key: 'avif', label: 'AVIF Format', description: 'Next-gen format' }
]

export function ImageTransformer({ 
  imageId, 
  originalUrl, 
  fileName, 
  className 
}: ImageTransformerProps) {
  const [transformedUrls, setTransformedUrls] = useState<TransformedUrls>({})
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [isTransforming, setIsTransforming] = useState(false)
  const [customTransform, setCustomTransform] = useState({
    width: '',
    height: '',
    quality: '',
    format: 'webp' as 'jpg' | 'png' | 'webp' | 'avif',
    crop: 'maintain_ratio' as 'maintain_ratio' | 'force' | 'at_max' | 'at_least'
  })

  const handlePresetToggle = (preset: string) => {
    setSelectedPresets(prev => 
      prev.includes(preset) 
        ? prev.filter(p => p !== preset)
        : [...prev, preset]
    )
  }

  const handleTransform = async () => {
    if (selectedPresets.length === 0) {
      toast.error('Please select at least one transformation preset')
      return
    }

    setIsTransforming(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      const response = await axios.post('/api/media/transform', {
        imageId,
        transformations: selectedPresets
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTransformedUrls(response.data.transformedUrls)
      toast.success('Images transformed successfully')
    } catch (error) {
      console.error('Transformation failed:', error)
      toast.error('Failed to transform images')
    } finally {
      setIsTransforming(false)
    }
  }

  const handleCustomTransform = async () => {
    const customOptions: any = {}
    
    if (customTransform.width) customOptions.width = parseInt(customTransform.width)
    if (customTransform.height) customOptions.height = parseInt(customTransform.height)
    if (customTransform.quality) customOptions.quality = parseInt(customTransform.quality)
    if (customTransform.format) customOptions.format = customTransform.format
    if (customTransform.crop) customOptions.crop = customTransform.crop

    if (Object.keys(customOptions).length === 0) {
      toast.error('Please specify at least one transformation parameter')
      return
    }

    setIsTransforming(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      const response = await axios.post('/api/media/transform', {
        imageId,
        transformations: customOptions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setTransformedUrls(prev => ({
        ...prev,
        custom: response.data.transformedUrls.custom
      }))
      toast.success('Custom transformation applied')
    } catch (error) {
      console.error('Custom transformation failed:', error)
      toast.error('Failed to apply custom transformation')
    } finally {
      setIsTransforming(false)
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('URL copied to clipboard')
  }

  const downloadImage = (url: string, transformKey: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName}-${transformKey}.webp`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Original Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Original Image
          </CardTitle>
          <CardDescription>{fileName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={originalUrl}
              alt={fileName}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preset Transformations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Preset Transformations
          </CardTitle>
          <CardDescription>
            Select predefined transformation presets to apply to your image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESET_TRANSFORMATIONS.map((preset) => (
              <div
                key={preset.key}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-all',
                  selectedPresets.includes(preset.key)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => handlePresetToggle(preset.key)}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm">{preset.label}</h4>
                  {selectedPresets.includes(preset.key) && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{preset.description}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleTransform}
              disabled={selectedPresets.length === 0 || isTransforming}
              className="flex items-center gap-2"
            >
              {isTransforming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              {isTransforming ? 'Transforming...' : 'Apply Transformations'}
            </Button>
            {selectedPresets.length > 0 && (
              <Badge variant="outline">
                {selectedPresets.length} preset(s) selected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Transformation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Custom Transformation
          </CardTitle>
          <CardDescription>
            Create a custom transformation with specific parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                placeholder="800"
                value={customTransform.width}
                onChange={(e) => setCustomTransform(prev => ({ ...prev, width: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                placeholder="600"
                value={customTransform.height}
                onChange={(e) => setCustomTransform(prev => ({ ...prev, height: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality">Quality (%)</Label>
              <Input
                id="quality"
                type="number"
                min="1"
                max="100"
                placeholder="80"
                value={customTransform.quality}
                onChange={(e) => setCustomTransform(prev => ({ ...prev, quality: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select 
                value={customTransform.format} 
                onValueChange={(value: 'jpg' | 'png' | 'webp' | 'avif') => 
                  setCustomTransform(prev => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="jpg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="avif">AVIF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Crop Mode</Label>
            <Select 
              value={customTransform.crop} 
              onValueChange={(value: 'maintain_ratio' | 'force' | 'at_max' | 'at_least') => 
                setCustomTransform(prev => ({ ...prev, crop: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintain_ratio">Maintain Aspect Ratio</SelectItem>
                <SelectItem value="force">Force Dimensions</SelectItem>
                <SelectItem value="at_max">At Maximum</SelectItem>
                <SelectItem value="at_least">At Least</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCustomTransform}
            disabled={isTransforming}
            variant="outline"
            className="flex items-center gap-2"
          >
            {isTransforming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
            Apply Custom Transform
          </Button>
        </CardContent>
      </Card>

      {/* Transformed Results */}
      {Object.keys(transformedUrls).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transformed Images</CardTitle>
            <CardDescription>
              Preview and download your transformed images.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(transformedUrls).map(([key, url]) => (
                <div key={key} className="space-y-3">
                  <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={url}
                      alt={`${fileName} - ${key}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm capitalize">
                        {key.replace('_', ' ')}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        Transformed
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(url)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy URL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadImage(url, key)}
                        className="flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}