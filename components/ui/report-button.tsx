'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Flag, AlertTriangle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface ReportButtonProps {
  type: 'REVIEW' | 'RESTAURANT' | 'USER' | 'COMMENT'
  targetId: string
  targetName?: string
  size?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
}

const REPORT_REASONS = [
  'Spam',
  'Harassment',
  'Inappropriate Content',
  'Fake Information',
  'Copyright Violation',
  'Violence',
  'Hate Speech',
  'Nudity',
  'Other'
]

export function ReportButton({ 
  type, 
  targetId, 
  targetName,
  size = 'sm',
  variant = 'ghost',
  className = ''
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason for reporting')
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      await axios.post('/api/reports', {
        type,
        targetId,
        reason,
        description: description.trim() || undefined
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      toast.success('Report submitted successfully')
      setIsOpen(false)
      setReason('')
      setDescription('')
    } catch (error: any) {
      console.error('Report submission failed:', error)
      toast.error(error.response?.data?.error || 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeLabel = () => {
    switch (type) {
      case 'REVIEW': return 'review'
      case 'RESTAURANT': return 'restaurant'
      case 'USER': return 'user'
      case 'COMMENT': return 'comment'
      default: return 'content'
    }
  }

  const getSeverityBadge = (reason: string) => {
    const highSeverity = ['Harassment', 'Violence', 'Hate Speech']
    const mediumSeverity = ['Inappropriate Content', 'Fake Information', 'Nudity']
    
    if (highSeverity.includes(reason)) {
      return <Badge variant="destructive" className="ml-2">High</Badge>
    } else if (mediumSeverity.includes(reason)) {
      return <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">Medium</Badge>
    }
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Flag className="h-4 w-4 mr-1" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Report {getTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Help us maintain a safe community by reporting inappropriate content.
            {targetName && (
              <span className="block mt-1 font-medium">
                Reporting: {targetName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Reason for reporting <span className="text-red-500">*</span>
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((reportReason) => (
                  <SelectItem key={reportReason} value={reportReason}>
                    <div className="flex items-center justify-between w-full">
                      <span>{reportReason}</span>
                      {getSeverityBadge(reportReason)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">
              Additional details (optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context about this report..."
              className="mt-1"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex">
              <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Please note:</p>
                <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                  <li>False reports may result in account penalties</li>
                  <li>Reports are reviewed by our moderation team</li>
                  <li>You'll be notified of any actions taken</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}