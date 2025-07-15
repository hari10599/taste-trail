'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Users, Star, Clock, CheckCircle, XCircle, MessageSquare, 
  Instagram, Youtube, Music, ExternalLink, Search, Filter,
  Calendar, User, Mail, Loader2, AlertCircle, UserCheck
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface InfluencerApplication {
  id: string
  userId: string
  instagramHandle?: string
  youtubeChannel?: string
  tiktokHandle?: string
  followerCount: number
  contentType: string[]
  reasonForApplication: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewerNotes?: string
  user: {
    id: string
    name: string
    email: string
    avatar?: string
    createdAt: string
  }
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

export default function InfluencerApplicationsPage() {
  const [applications, setApplications] = useState<InfluencerApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<InfluencerApplication | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [activeTab, pagination.page])

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      
      if (activeTab !== 'all') {
        params.append('status', activeTab.toUpperCase())
      }
      
      const response = await axios.get(`/api/admin/influencer-applications?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setApplications(response.data.applications)
      setPagination(response.data.pagination)
    } catch (error: any) {
      console.error('Failed to fetch applications:', error)
      toast.error('Failed to fetch influencer applications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (applicationId: string, status: 'APPROVED' | 'REJECTED') => {
    setIsReviewing(true)
    try {
      const token = localStorage.getItem('accessToken')
      await axios.put('/api/admin/influencer-applications', {
        applicationId,
        status,
        reviewerNotes: reviewNotes
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      toast.success(`Application ${status.toLowerCase()} successfully`)
      setSelectedApplication(null)
      setReviewNotes('')
      fetchApplications()
    } catch (error: any) {
      console.error('Failed to review application:', error)
      toast.error('Failed to review application')
    } finally {
      setIsReviewing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case 'APPROVED':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case 'REJECTED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <Instagram className="h-4 w-4" />
      case 'youtube':
        return <Youtube className="h-4 w-4" />
      case 'tiktok':
        return <Music className="h-4 w-4" />
      default:
        return <ExternalLink className="h-4 w-4" />
    }
  }

  const filteredApplications = applications.filter(app =>
    app.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getTabCounts = () => {
    const counts = {
      pending: applications.filter(app => app.status === 'PENDING').length,
      approved: applications.filter(app => app.status === 'APPROVED').length,
      rejected: applications.filter(app => app.status === 'REJECTED').length,
      all: applications.length
    }
    return counts
  }

  const tabCounts = getTabCounts()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Influencer Applications</h1>
          <p className="text-gray-600 mt-1">Review and manage influencer applications</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Users className="h-4 w-4 mr-1" />
            {pagination.total} Total
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({tabCounts.pending})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({tabCounts.approved})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({tabCounts.rejected})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All ({tabCounts.all})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar
                          src={application.user.avatar}
                          alt={application.user.name}
                          fallback={application.user.name}
                          size="lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{application.user.name}</h3>
                            {getStatusBadge(application.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {application.user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Applied {format(new Date(application.submittedAt), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {application.followerCount.toLocaleString()} followers
                            </span>
                          </div>
                          
                          {/* Social Links */}
                          <div className="flex items-center gap-3 mb-3">
                            {application.instagramHandle && (
                              <a
                                href={`https://instagram.com/${application.instagramHandle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-pink-600 hover:text-pink-700 text-sm"
                              >
                                <Instagram className="h-4 w-4" />
                                @{application.instagramHandle}
                              </a>
                            )}
                            {application.youtubeChannel && (
                              <a
                                href={application.youtubeChannel}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                              >
                                <Youtube className="h-4 w-4" />
                                YouTube
                              </a>
                            )}
                            {application.tiktokHandle && (
                              <a
                                href={`https://tiktok.com/@${application.tiktokHandle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-gray-800 hover:text-gray-900 text-sm"
                              >
                                <Music className="h-4 w-4" />
                                @{application.tiktokHandle}
                              </a>
                            )}
                          </div>
                          
                          {/* Content Types */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {application.contentType.map((type, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                          
                          {/* Application Reason */}
                          <p className="text-sm text-gray-700 mb-3">
                            <strong>Reason:</strong> {application.reasonForApplication}
                          </p>
                          
                          {/* Review Notes */}
                          {application.reviewerNotes && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3">
                              <p className="text-sm">
                                <strong>Review Notes:</strong> {application.reviewerNotes}
                              </p>
                              {application.reviewedAt && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Reviewed on {format(new Date(application.reviewedAt), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link href={`/users/${application.userId}`} target="_blank">
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            View Profile
                          </Button>
                        </Link>
                        
                        {application.status === 'PENDING' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedApplication(application)
                                  setReviewNotes('')
                                }}
                                className="flex items-center gap-2"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Review Application</DialogTitle>
                                <DialogDescription>
                                  Review {application.user.name}'s influencer application
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="notes">Review Notes (optional)</Label>
                                  <Textarea
                                    id="notes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add any notes about your decision..."
                                    className="min-h-[100px]"
                                  />
                                </div>
                                
                                <div className="flex items-center gap-3 pt-4">
                                  <Button
                                    onClick={() => handleReview(application.id, 'APPROVED')}
                                    disabled={isReviewing}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                  >
                                    {isReviewing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleReview(application.id, 'REJECTED')}
                                    disabled={isReviewing}
                                    variant="outline"
                                    className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    {isReviewing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4" />
                                    )}
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}