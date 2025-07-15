'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import axios from 'axios'
import toast from 'react-hot-toast'

interface ClaimRestaurantDialogProps {
  restaurantId: string
  restaurantName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ClaimRestaurantDialog({
  restaurantId,
  restaurantName,
  isOpen,
  onClose,
  onSuccess
}: ClaimRestaurantDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    businessLicense: '',
    ownershipProof: '',
    taxDocument: '',
    additionalDocuments: [] as string[],
    phoneNumber: '',
    email: '',
    position: '',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.phoneNumber || !formData.email || !formData.position || !formData.message) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (formData.message.length < 50) {
      toast.error('Message must be at least 50 characters')
      return
    }
    
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await axios.post(
        `/api/restaurants/${restaurantId}/claim`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      toast.success(response.data.message)
      onSuccess?.()
      onClose()
    } catch (error: any) {
      console.error('Claim submission error:', error)
      toast.error(error.response?.data?.error || 'Failed to submit claim')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUpload = (field: string) => {
    // In a real implementation, this would handle file upload to storage
    toast('File upload functionality would be implemented here')
    // For demo purposes, we'll just set a placeholder URL
    setFormData(prev => ({
      ...prev,
      [field]: `https://storage.example.com/${field}-${Date.now()}.pdf`
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim Restaurant Ownership</DialogTitle>
          <DialogDescription>
            Submit your claim for <strong>{restaurantName}</strong>. Please provide accurate information and supporting documents.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              All claims are thoroughly reviewed. Providing false information may result in account suspension.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position at Restaurant *</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">Owner</SelectItem>
                  <SelectItem value="Co-Owner">Co-Owner</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Franchisee">Franchisee</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Business Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Business Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@restaurant.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Supporting Documents</h3>
            <p className="text-sm text-gray-600">
              Upload documents to verify your ownership. At least one document is recommended.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Business License</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload('businessLicense')}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  {formData.businessLicense && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, businessLicense: '' }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.businessLicense && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Document uploaded
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Ownership Proof</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload('ownershipProof')}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  {formData.ownershipProof && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, ownershipProof: '' }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.ownershipProof && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Document uploaded
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tax Document</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload('taxDocument')}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  {formData.taxDocument && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, taxDocument: '' }))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {formData.taxDocument && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Document uploaded
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Why should you be verified as the owner? *</Label>
            <Textarea
              id="message"
              placeholder="Please provide details about your relationship with the restaurant, how long you've been associated with it, and any other relevant information..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              rows={5}
              required
              minLength={50}
            />
            <p className="text-xs text-gray-500">
              {formData.message.length}/50 characters minimum
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}