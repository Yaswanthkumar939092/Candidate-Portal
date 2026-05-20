'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { AdminNavigation } from '@/components/admin-navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Users,
  CheckCircle,
  XCircle,
  Loader2,
  UserPlus,
  ClipboardList,
  Clock,
  FileCheck,
  Send,
} from 'lucide-react'

interface OnboardingRecord {
  id: string
  user_id: string
  status: 'draft' | 'submitted' | 'approved' | 'pushed_to_frappe'
  current_step: number
  completed_steps: string[]
  frappe_employee_id: string | null
  submitted_at: string | null
  approved_at: string | null
  pushed_to_frappe_at: string | null
  created_at: string
  updated_at: string
  profile: {
    id: string
    email: string
    full_name: string | null
    lifecycle_stage: string
    avatar_url: string | null
  } | null
}

interface User {
  id: string
  email?: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  approved: { label: 'Approved', variant: 'outline' },
  pushed_to_frappe: { label: 'Employee Created', variant: 'default' },
}

export default function OnboardingManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<OnboardingRecord[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: 'approve' | 'reject' | 'create-employee'
    userId: string
    name: string
  } | null>(null)

  useEffect(() => {
    checkUserAndLoad()
  }, [])

  const checkUserAndLoad = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
      await loadRecords()
    } catch (error) {
      console.error('Error loading page:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadRecords = async () => {
    try {
      const response = await fetch('/api/admin/onboarding')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setRecords(data.data || [])
    } catch (error) {
      console.error('Error loading onboarding records:', error)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/onboarding/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to approve')
      }

      await loadRecords()
      setConfirmDialog(null)
    } catch (error) {
      console.error('Approve error:', error)
      alert(error instanceof Error ? error.message : 'Failed to approve onboarding')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/onboarding/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to reject')
      }

      await loadRecords()
      setConfirmDialog(null)
    } catch (error) {
      console.error('Reject error:', error)
      alert(error instanceof Error ? error.message : 'Failed to reject onboarding')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateEmployee = async (userId: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/onboarding/${userId}/create-employee`, {
        method: 'POST',
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create employee')
      }

      const data = await response.json()
      alert(`Employee created successfully!\nFrappe Employee ID: ${data.data?.frappe_employee_id}`)
      await loadRecords()
      setConfirmDialog(null)
    } catch (error) {
      console.error('Create employee error:', error)
      alert(error instanceof Error ? error.message : 'Failed to create Frappe employee')
    } finally {
      setActionLoading(null)
    }
  }

  const getProgressPercentage = (record: OnboardingRecord) => {
    const totalSteps = 8
    const completed = record.completed_steps?.length ?? 0
    return Math.round((completed / totalSteps) * 100)
  }

  const stats = {
    total: records.length,
    draft: records.filter((r) => r.status === 'draft').length,
    submitted: records.filter((r) => r.status === 'submitted').length,
    approved: records.filter((r) => r.status === 'approved').length,
    pushed: records.filter((r) => r.status === 'pushed_to_frappe').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading onboarding data...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminNavigation />

        <div className="flex-1 ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">Onboarding Management</h1>
              <p className="text-muted-foreground">
                Review and manage candidate onboarding submissions.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.draft}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                  <Send className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.submitted}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <FileCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Employees</CardTitle>
                  <UserPlus className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.pushed}</div>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            {records.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No onboarding records yet
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Records will appear here when candidates begin the onboarding process.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Frappe ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => {
                        const progress = getProgressPercentage(record)
                        const statusCfg = STATUS_CONFIG[record.status] || STATUS_CONFIG.draft

                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">
                              {record.profile?.full_name || 'Unknown'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {record.profile?.email || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">{progress}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {record.submitted_at
                                ? new Date(record.submitted_at).toLocaleDateString()
                                : '-'}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {record.frappe_employee_id || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {record.status === 'submitted' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      disabled={actionLoading === record.user_id}
                                      onClick={() =>
                                        setConfirmDialog({
                                          open: true,
                                          type: 'approve',
                                          userId: record.user_id,
                                          name: record.profile?.full_name || 'this candidate',
                                        })
                                      }
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={actionLoading === record.user_id}
                                      onClick={() =>
                                        setConfirmDialog({
                                          open: true,
                                          type: 'reject',
                                          userId: record.user_id,
                                          name: record.profile?.full_name || 'this candidate',
                                        })
                                      }
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                {record.status === 'approved' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    disabled={actionLoading === record.user_id}
                                    onClick={() =>
                                      setConfirmDialog({
                                        open: true,
                                        type: 'create-employee',
                                        userId: record.user_id,
                                        name: record.profile?.full_name || 'this candidate',
                                      })
                                    }
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Create Employee
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) => {
            if (!open) setConfirmDialog(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmDialog.type === 'approve' && 'Approve Onboarding'}
                {confirmDialog.type === 'reject' && 'Reject Onboarding'}
                {confirmDialog.type === 'create-employee' && 'Create Frappe Employee'}
              </DialogTitle>
              <DialogDescription>
                {confirmDialog.type === 'approve' &&
                  `Are you sure you want to approve onboarding for ${confirmDialog.name}?`}
                {confirmDialog.type === 'reject' &&
                  `Are you sure you want to reject onboarding for ${confirmDialog.name}? This will revert to draft status.`}
                {confirmDialog.type === 'create-employee' &&
                  `This will create a User and Employee record in Frappe for ${confirmDialog.name}. This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                Cancel
              </Button>
              <Button
                variant={confirmDialog.type === 'reject' ? 'destructive' : 'default'}
                disabled={actionLoading === confirmDialog.userId}
                onClick={() => {
                  if (confirmDialog.type === 'approve') handleApprove(confirmDialog.userId)
                  if (confirmDialog.type === 'reject') handleReject(confirmDialog.userId)
                  if (confirmDialog.type === 'create-employee')
                    handleCreateEmployee(confirmDialog.userId)
                }}
              >
                {actionLoading === confirmDialog.userId ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {confirmDialog.type === 'approve' && 'Approve'}
                    {confirmDialog.type === 'reject' && 'Reject'}
                    {confirmDialog.type === 'create-employee' && 'Create Employee'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
