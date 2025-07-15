'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface DeleteReviewDialogProps {
  reviewId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteReviewDialog({ reviewId, isOpen, onClose, onSuccess }: DeleteReviewDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await axios.delete(`/api/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      })
      
      toast.success('Review deleted successfully!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete review')
    } finally {
      setIsDeleting(false)
    }
  }
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <AlertDialogTitle className="text-xl font-semibold text-gray-900">
            Delete Review
          </AlertDialogTitle>
          <AlertDialogDescription className="mt-2 text-gray-500">
            Are you sure you want to delete this review? This action cannot be undone and will permanently remove your review and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center sm:gap-3">
          <AlertDialogCancel 
            disabled={isDeleting}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Review
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}