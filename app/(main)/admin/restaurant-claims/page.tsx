'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Building, Search, Filter, Calendar, User, Phone, Mail,
  FileText, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight,
  AlertCircle, ExternalLink, Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface RestaurantClaim {
  id: string
  status: string
  submittedAt: string
  reviewedAt?: string
  position: string
  phoneNumber: string
  email: string
  message: string
  businessLicense?: string
  ownershipProof?: string
  taxDocument?: string
  additionalDocuments: string[]
  reviewerNotes?: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string | null
  }
  restaurant: {
    id: string
    name: string
    address?: string
    phone?: string
  }
}

export default function RestaurantClaimsPage() {
  const [claims, setClaims] = useState<RestaurantClaim[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedClaim, setSelectedClaim] = useState<RestaurantClaim | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  useEffect(() => {
    fetchClaims()
  }, [statusFilter, pagination.page])

  const fetchClaims = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('accessToken')
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await axios.get(`/api/admin/restaurant-claims?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setClaims(response.data.claims)
      setPagination(prev => ({
        ...prev,
        total: response.data.total,
        totalPages: response.data.totalPages
      }))
    } catch (error) {
      console.error('Failed to fetch claims:', error)
      toast.error('Failed to load claims')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (claimId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsReviewing(true)
    try {
      const token = localStorage.getItem('accessToken')
      
      await axios.put('/api/admin/restaurant-claims', {
        claimId,
        status,
        reviewerNotes: reviewNotes
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      toast.success(`Claim ${status.toLowerCase()} successfully`)
      setSelectedClaim(null)
      setReviewNotes('')
      fetchClaims()
    } catch (error) {
      console.error('Failed to review claim:', error)
      toast.error('Failed to process claim')
    } finally {
      setIsReviewing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'APPROVED':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return null
    }
  }

  const filteredClaims = claims.filter(claim => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      claim.user.name.toLowerCase().includes(query) ||
      claim.user.email.toLowerCase().includes(query) ||
      claim.restaurant.name.toLowerCase().includes(query) ||
      claim.position.toLowerCase().includes(query)
    )
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Claims</h1>
        <p className="text-gray-600">Review and manage restaurant ownership claims</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, email, or restaurant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={fetchClaims}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claims List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredClaims.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No claims found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredClaims.map((claim) => (
            <Card key={claim.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={claim.user.avatar}
                      alt={claim.user.name}
                      fallback={claim.user.name}
                      size="lg"
                    />
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {claim.user.name}
                        {getStatusBadge(claim.status)}
                      </h3>
                      <p className="text-gray-600">{claim.user.email}</p>
                      
                      <div className="mt-3 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Restaurant:</span>{' '}
                          <Link 
                            href={`/restaurants/${claim.restaurant.id}`}
                            className="text-primary hover:underline"
                            target="_blank"
                          >
                            {claim.restaurant.name} <ExternalLink className="h-3 w-3 inline" />
                          </Link>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Position:</span> {claim.position}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Contact:</span> {claim.phoneNumber} | {claim.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted {formatDistanceToNow(new Date(claim.submittedAt), { addSuffix: true })}
                        </p>
                      </div>
                      
                      {claim.status !== 'PENDING' && claim.reviewedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Reviewed {formatDistanceToNow(new Date(claim.reviewedAt), { addSuffix: true })}
                          {claim.reviewerNotes && (
                            <span className="block mt-1">
                              <span className="font-medium">Notes:</span> {claim.reviewerNotes}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {claim.status === 'PENDING' && (
                    <Button
                      onClick={() => {
                        setSelectedClaim(claim)
                        setReviewNotes('')
                      }}
                    >
                      Review Claim
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      {selectedClaim && (
        <Dialog open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Restaurant Claim</DialogTitle>
              <DialogDescription>
                Review the claim details and make a decision
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Claimant Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedClaim.user.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedClaim.user.email}</p>
                    <p><span className="font-medium">Position:</span> {selectedClaim.position}</p>
                    <p><span className="font-medium">Contact:</span> {selectedClaim.phoneNumber}</p>
                    <p><span className="font-medium">Business Email:</span> {selectedClaim.email}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Restaurant Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {selectedClaim.restaurant.name}</p>
                    {selectedClaim.restaurant.address && (
                      <p><span className="font-medium">Address:</span> {selectedClaim.restaurant.address}</p>
                    )}
                    {selectedClaim.restaurant.phone && (
                      <p><span className="font-medium">Phone:</span> {selectedClaim.restaurant.phone}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Application Message</h4>
                <p className="text-sm bg-gray-50 p-3 rounded">{selectedClaim.message}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Submitted Documents</h4>
                <div className="grid grid-cols-2 gap-2">
                  {selectedClaim.businessLicense && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedClaim.businessLicense} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Business License
                      </a>
                    </Button>
                  )}
                  {selectedClaim.ownershipProof && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedClaim.ownershipProof} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Ownership Proof
                      </a>
                    </Button>
                  )}
                  {selectedClaim.taxDocument && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedClaim.taxDocument} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Tax Document
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add any notes about this decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Approving this claim will set {selectedClaim.user.name} as the verified owner of {selectedClaim.restaurant.name}.
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedClaim(null)}
                  disabled={isReviewing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview(selectedClaim.id, 'REJECTED')}
                  disabled={isReviewing}
                >
                  {isReviewing ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  onClick={() => handleReview(selectedClaim.id, 'APPROVED')}
                  disabled={isReviewing}
                >
                  {isReviewing ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}