'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { UserBadge, getRoleDisplayName } from '@/components/ui/user-badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Users, Search, Filter, MoreHorizontal, Shield, 
  UserX, UserCheck, AlertTriangle, Crown, Building, Loader2, RefreshCw
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: string
  verified: boolean
  createdAt: string
  _count: {
    reviews: number
    likes: number
    reports: number
    strikes: number
  }
  moderationActions?: Array<{
    type: string
    reason: string
    expiresAt: string | null
    createdAt: string
  }>
}

interface ModerationDialog {
  isOpen: boolean
  user: User | null
  action: 'ban' | 'tempban' | 'unban' | 'warn' | 'promote' | 'verify' | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [moderationDialog, setModerationDialog] = useState<ModerationDialog>({
    isOpen: false,
    user: null,
    action: null
  })
  const [moderationReason, setModerationReason] = useState('')
  const [banDuration, setBanDuration] = useState('7') // Default 7 days for tempban
  const [moderatingUserId, setModeratingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter, statusFilter])

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (page === 1) {
        fetchUsers()
      } else {
        setPage(1)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await axios.get(`/api/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUsers(response.data.users)
      setTotalPages(response.data.pagination.totalPages)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleModerationAction = async () => {
    if (!moderationDialog.user || !moderationDialog.action) return

    const userId = moderationDialog.user.id
    const action = moderationDialog.action
    
    setModeratingUserId(userId)
    
    try {
      const token = localStorage.getItem('accessToken')
      
      await axios.post('/api/admin/moderation', {
        userId: userId,
        action: action,
        reason: moderationReason,
        duration: action === 'tempban' ? parseInt(banDuration) : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success(`User ${action} action completed`)
      setModerationDialog({ isOpen: false, user: null, action: null })
      setModerationReason('')
      setBanDuration('7')
      
      // Optimistic UI update that persists until next manual refresh
      setUsers(prevUsers => {
        const updatedUsers = prevUsers.map(user => {
          if (user.id === userId) {
            if (action === 'ban' || action === 'tempban') {
              // Add moderation action for ban
              const updatedUser = {
                ...user,
                moderationActions: [{
                  type: action === 'ban' ? 'PERMANENT_BAN' : 'TEMPORARY_BAN',
                  reason: moderationReason,
                  expiresAt: action === 'tempban' ? new Date(Date.now() + parseInt(banDuration) * 24 * 60 * 60 * 1000).toISOString() : null,
                  createdAt: new Date().toISOString()
                }]
              }
              console.log('Updated user after ban:', updatedUser)
              return updatedUser
            } else if (action === 'unban') {
              // Clear moderation actions for unban
              return {
                ...user,
                moderationActions: []
              }
            } else if (action === 'verify') {
              return { ...user, verified: true }
            }
          }
          return user
        })
        return updatedUsers
      })
      
      // Clear loading state without refetching
      setTimeout(() => {
        setModeratingUserId(null)
      }, 300)
    } catch (error) {
      console.error('Moderation action failed:', error)
      toast.error('Failed to perform moderation action')
      setModeratingUserId(null)
    }
  }

  const openModerationDialog = (user: User, action: 'ban' | 'tempban' | 'unban' | 'warn' | 'promote' | 'verify') => {
    setModerationDialog({ isOpen: true, user, action })
  }


  const getActionTitle = (action: string) => {
    switch (action) {
      case 'ban': return 'Ban User Permanently'
      case 'tempban': return 'Temporary Ban'
      case 'unban': return 'Unban User'
      case 'warn': return 'Warn User'
      case 'promote': return 'Promote User'
      case 'verify': return 'Verify User'
      default: return 'Moderate User'
    }
  }

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'ban': return 'This will permanently ban the user from the platform. They will not be able to log in or access any features.'
      case 'tempban': return 'This will temporarily ban the user from the platform for the specified duration.'
      case 'unban': return 'This will remove all active bans and reinstate the user account. They will be able to log in again.'
      case 'warn': return 'This will send a warning to the user about their behavior. Multiple warnings may result in suspension.'
      case 'promote': return 'This will promote the user to moderator role, giving them moderation privileges.'
      case 'verify': return 'This will verify the user account, giving them a verified badge.'
      default: return 'Please confirm this moderation action.'
    }
  }

  const getUserBanStatus = (user: User) => {
    if (!user.moderationActions || user.moderationActions.length === 0) return null
    
    const activeBan = user.moderationActions[0] // We already filtered for active bans in the API
    if (activeBan.type === 'PERMANENT_BAN') {
      return { status: 'permanently banned', color: 'bg-red-100 text-red-700 border-red-200' }
    } else if (activeBan.type === 'TEMPORARY_BAN') {
      if (activeBan.expiresAt) {
        const expiryDate = new Date(activeBan.expiresAt)
        return { 
          status: `banned until ${expiryDate.toLocaleDateString()}`, 
          color: 'bg-orange-100 text-orange-700 border-orange-200' 
        }
      } else {
        // Temporary ban without expiry date (shouldn't happen, but handle it)
        return { 
          status: 'temporarily banned', 
          color: 'bg-orange-100 text-orange-700 border-orange-200' 
        }
      }
    }
    return null
  }

  if (loading && users.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage users, roles, and account status
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers()}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="INFLUENCER">Influencers</SelectItem>
                <SelectItem value="OWNER">Owners</SelectItem>
                <SelectItem value="MODERATOR">Moderators</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div 
                key={user.id} 
                className={`flex items-center justify-between p-4 border rounded-lg relative ${
                  moderatingUserId === user.id ? 'opacity-60' : ''
                }`}
              >
                {moderatingUserId === user.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    fallback={user.name}
                    className="w-12 h-12"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{user.name}</h3>
                      {user.verified && <UserCheck className="h-4 w-4 text-green-500" />}
                      <UserBadge role={user.role} size="sm" className="show-user" />
                      {(() => {
                        const banStatus = getUserBanStatus(user)
                        return banStatus ? (
                          <Badge className={`text-xs ${banStatus.color}`}>
                            {banStatus.status}
                          </Badge>
                        ) : null
                      })()}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                      <span>{user._count.reviews} reviews</span>
                      <span>{user._count.likes} likes</span>
                      {user._count.reports > 0 && (
                        <span className="text-red-500">{user._count.reports} reports</span>
                      )}
                      {user._count.strikes > 0 && (
                        <span className="text-orange-500">{user._count.strikes} strikes</span>
                      )}
                      <span>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getUserBanStatus(user) ? (
                    // Show unban button for banned users
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModerationDialog(user, 'unban')}
                      className="text-green-600 hover:text-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Unban
                    </Button>
                  ) : (
                    // Show regular moderation buttons for non-banned users
                    <>
                      {!user.verified && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModerationDialog(user, 'verify')}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      )}
                      {user.role === 'USER' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModerationDialog(user, 'promote')}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Promote
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModerationDialog(user, 'warn')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Warn
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModerationDialog(user, 'tempban')}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Temp Ban
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModerationDialog(user, 'ban')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Ban
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
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
        </CardContent>
      </Card>

      {/* Moderation Dialog */}
      <Dialog open={moderationDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setModerationDialog({ isOpen: false, user: null, action: null })
          setModerationReason('')
          setBanDuration('7')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationDialog.action && getActionTitle(moderationDialog.action)}
            </DialogTitle>
            <DialogDescription>
              {moderationDialog.action && getActionDescription(moderationDialog.action)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason (required)</label>
              <Textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Provide a reason for this action..."
                className="mt-1"
              />
            </div>
            {moderationDialog.action === 'tempban' && (
              <div>
                <label className="text-sm font-medium">Ban Duration (days)</label>
                <Input
                  type="number"
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  min="1"
                  max="365"
                  placeholder="Enter duration in days"
                  className="mt-1"
                />
              </div>
            )}
            {moderationDialog.action === 'unban' && moderationDialog.user && getUserBanStatus(moderationDialog.user) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  Current ban: <strong>{getUserBanStatus(moderationDialog.user)!.status}</strong>
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModerationDialog({ isOpen: false, user: null, action: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleModerationAction}
              disabled={!moderationReason.trim() || (moderationDialog.action === 'tempban' && (!banDuration || parseInt(banDuration) < 1))}
              className={
                moderationDialog.action === 'ban' ? 'bg-red-600 hover:bg-red-700' : 
                moderationDialog.action === 'tempban' ? 'bg-orange-600 hover:bg-orange-700' : 
                moderationDialog.action === 'unban' ? 'bg-green-600 hover:bg-green-700' : ''
              }
            >
              Confirm {moderationDialog.action && moderationDialog.action.charAt(0).toUpperCase() + moderationDialog.action.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}