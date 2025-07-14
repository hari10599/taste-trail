'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  Flag, AlertTriangle, CheckCircle, XCircle, 
  Clock, User, FileText, Building, MessageSquare,
  Eye, Ban, AlertOctagon
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Report {
  id: string
  type: string
  targetId: string
  reason: string
  description?: string
  status: string
  createdAt: string
  updatedAt: string
  reporter: {
    id: string
    name: string
    role: string
  }
}

interface ResolveDialog {
  isOpen: boolean
  report: Report | null
  action: 'approve' | 'reject' | null
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [resolveDialog, setResolveDialog] = useState<ResolveDialog>({
    isOpen: false,
    report: null,
    action: null
  })
  const [resolutionNotes, setResolutionNotes] = useState('')

  useEffect(() => {
    fetchReports()
  }, [activeTab, page])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        type: 'reports'
      })

      if (activeTab !== 'all') {
        params.append('status', activeTab)
      }

      const response = await axios.get(`/api/admin/moderation?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setReports(response.data.reports || [])
      setTotalPages(response.data.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
      toast.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveReport = async () => {
    if (!resolveDialog.report || !resolveDialog.action) return

    try {
      const token = localStorage.getItem('accessToken')
      
      await axios.post('/api/admin/reports/resolve', {
        reportId: resolveDialog.report.id,
        action: resolveDialog.action,
        notes: resolutionNotes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success(`Report ${resolveDialog.action}d successfully`)
      setResolveDialog({ isOpen: false, report: null, action: null })
      setResolutionNotes('')
      fetchReports() // Refresh the list
    } catch (error) {
      console.error('Failed to resolve report:', error)
      toast.error('Failed to resolve report')
    }
  }

  const openResolveDialog = (report: Report, action: 'approve' | 'reject') => {
    setResolveDialog({ isOpen: true, report, action })
  }

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'REVIEW': return <FileText className="h-4 w-4" />
      case 'RESTAURANT': return <Building className="h-4 w-4" />
      case 'USER': return <User className="h-4 w-4" />
      case 'COMMENT': return <MessageSquare className="h-4 w-4" />
      default: return <Flag className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="text-yellow-600">Pending</Badge>
      case 'INVESTIGATING':
        return <Badge variant="outline" className="text-blue-600">Investigating</Badge>
      case 'RESOLVED':
        return <Badge variant="outline" className="text-green-600">Resolved</Badge>
      case 'REJECTED':
        return <Badge variant="outline" className="text-red-600">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSeverityBadge = (reason: string) => {
    const highSeverity = ['Harassment', 'Violence', 'Hate Speech']
    const mediumSeverity = ['Inappropriate Content', 'Fake Information', 'Nudity']
    
    if (highSeverity.includes(reason)) {
      return <Badge className="bg-red-100 text-red-800">High Priority</Badge>
    } else if (mediumSeverity.includes(reason)) {
      return <Badge className="bg-orange-100 text-orange-800">Medium Priority</Badge>
    }
    return <Badge variant="outline">Low Priority</Badge>
  }

  const reportCounts = {
    pending: reports.filter(r => r.status === 'PENDING').length,
    investigating: reports.filter(r => r.status === 'INVESTIGATING').length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
    rejected: reports.filter(r => r.status === 'REJECTED').length
  }

  if (loading && reports.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Report Management</h1>
        <p className="text-gray-600 mt-2">
          Review and moderate user reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Reports</p>
                <p className="text-2xl font-bold text-yellow-600">{reportCounts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Investigating</p>
                <p className="text-2xl font-bold text-blue-600">{reportCounts.investigating}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{reportCounts.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{reportCounts.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Reports
          </CardTitle>
          <CardDescription>
            Review reported content and take appropriate actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="investigating">Investigating</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No reports found for this status
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getReportIcon(report.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{report.type} Report</h4>
                            {getStatusBadge(report.status)}
                            {getSeverityBadge(report.reason)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Reason:</strong> {report.reason}
                          </p>
                          {report.description && (
                            <p className="text-sm text-gray-700 mb-2">
                              <strong>Description:</strong> {report.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              Reported by {report.reporter.name} ({report.reporter.role})
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                            </span>
                            <span>Target ID: {report.targetId}</span>
                          </div>
                        </div>
                      </div>

                      {report.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openResolveDialog(report, 'reject')}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openResolveDialog(report, 'approve')}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Take Action
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
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
          </Tabs>
        </CardContent>
      </Card>

      {/* Resolve Report Dialog */}
      <Dialog open={resolveDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setResolveDialog({ isOpen: false, report: null, action: null })
          setResolutionNotes('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resolveDialog.action === 'approve' ? (
                <Ban className="h-5 w-5 text-red-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-500" />
              )}
              {resolveDialog.action === 'approve' ? 'Take Action' : 'Reject Report'}
            </DialogTitle>
            <DialogDescription>
              {resolveDialog.action === 'approve' 
                ? 'This will approve the report and take moderation action against the reported content.'
                : 'This will reject the report as invalid or not actionable.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Resolution Notes</label>
              <Textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Provide details about the resolution..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialog({ isOpen: false, report: null, action: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveReport}
              className={resolveDialog.action === 'approve' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {resolveDialog.action === 'approve' ? 'Take Action' : 'Reject Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}