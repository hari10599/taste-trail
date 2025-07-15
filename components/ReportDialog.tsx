'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface ReportDialogProps {
  isOpen: boolean
  onClose: () => void
  targetId: string
  targetType: 'review' | 'comment' | 'restaurant' | 'user'
  targetName?: string
}

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or misleading' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or hate speech' },
  { value: 'fake', label: 'Fake review or misinformation' },
  { value: 'offensive', label: 'Offensive language' },
  { value: 'other', label: 'Other' },
]

export function ReportDialog({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetName = 'this content'
}: ReportDialogProps) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason for reporting')
      return
    }

    if (reason === 'other' && !details.trim()) {
      toast.error('Please provide details for your report')
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      await axios.post('/api/reports', {
        targetId,
        type: targetType.toUpperCase(),
        reason,
        description: details.trim() || undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Report submitted successfully')
      onClose()
      setReason('')
      setDetails('')
    } catch (error: any) {
      console.error('Failed to submit report:', error)
      toast.error(error.response?.data?.error || 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with {targetName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Why are you reporting this?</Label>
            <RadioGroup value={reason} onValueChange={setReason}>
              {REPORT_REASONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label 
                    htmlFor={option.value} 
                    className="font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">
              Additional details {reason === 'other' && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide more information..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Report Guidelines</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>False reports may result in account restrictions</li>
                  <li>All reports are reviewed by our moderation team</li>
                  <li>You may be contacted for additional information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!reason || isSubmitting}
            variant="destructive"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}