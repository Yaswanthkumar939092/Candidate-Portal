'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { AdminNavigation } from '@/components/admin-navigation'
import { AdminStats } from '@/components/admin-stats'
import { JobSyncStatus } from '@/components/job-sync-status'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import {
  Users,
  Briefcase,
  FileText,
  Calendar,
  TrendingUp,
  Activity,
  Settings
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  activeJobs: number
  totalApplications: number
  pendingApplications: number
  statusDistribution: Record<string, number>
}

interface Application {
  id: string
  status: string
  applied_at: string
  jobs: {
    title: string
    company: string
  } | null
  profiles: {
    full_name: string | null
    email: string
  } | null
}

interface User {
  id: string
  email?: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<Application[]>([])

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  const checkUserAndLoadData = async () => {
    try {
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        router.push('/login')
        return
      }

      // Check if user has admin privileges
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (!profile) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
      await loadDashboardData()

    } catch (error) {
      console.error('Error loading dashboard:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Load dashboard statistics
      const [usersCount, jobsCount, applicationsCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('jobs').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('applications').select('id', { count: 'exact' })
      ])

      // Get recent applications
      const { data: recentApps } = await supabase
        .from('applications')
        .select(`
          *,
          jobs:job_id(title, company),
          profiles:candidate_id(full_name, email)
        `)
        .order('applied_at', { ascending: false })
        .limit(10)

      // Get application status distribution
      const { data: statusDistribution } = await supabase
        .from('applications')
        .select('status')

      const statusCounts = statusDistribution?.reduce((acc: Record<string, number>, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {} as Record<string, number>

      setStats({
        totalUsers: usersCount.count || 0,
        activeJobs: jobsCount.count || 0,
        totalApplications: applicationsCount.count || 0,
        pendingApplications: statusCounts.pending || 0,
        statusDistribution: statusCounts
      })

      setRecentActivity(recentApps || [])

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminNavigation />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Welcome back! Here's what's happening with your job portal.</p>
              </div>
              <div className="flex items-center space-x-4">
                <JobSyncStatus />
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <AdminStats stats={stats} />

            {/* Main Content Tabs */}
            <div className="mt-8">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Applications */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <FileText className="w-5 h-5" />
                          <span>Recent Applications</span>
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/admin/applications')}
                        >
                          View All
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {recentActivity.slice(0, 5).map((application: Application) => (
                            <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {application.profiles?.full_name || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {application.jobs?.title} at {application.jobs?.company}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-xs px-2 py-1 rounded-full ${
                                  application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  application.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                                  application.status === 'interviewing' ? 'bg-purple-100 text-purple-800' :
                                  application.status === 'offered' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {application.status}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {new Date(application.applied_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          ))}
                          {recentActivity.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No recent applications</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Application Status Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5" />
                          <span>Application Status</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {stats?.statusDistribution && Object.entries(stats.statusDistribution).map(([status, count]: [string, number]) => {
                            const percentage = ((count / stats.totalApplications) * 100).toFixed(1)
                            return (
                              <div key={status} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    status === 'pending' ? 'bg-yellow-400' :
                                    status === 'reviewing' ? 'bg-blue-400' :
                                    status === 'interviewing' ? 'bg-purple-400' :
                                    status === 'offered' ? 'bg-green-400' :
                                    status === 'rejected' ? 'bg-red-400' :
                                    'bg-gray-400'
                                  }`} />
                                  <span className="text-sm font-medium capitalize">{status}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{count}</div>
                                  <div className="text-xs text-gray-500">{percentage}%</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <span>Recent Activity</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivity.map((application: Application) => (
                          <div key={application.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">
                                New application from {application.profiles?.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Applied for {application.jobs?.title} at {application.jobs?.company}
                              </div>
                              <div className="text-xs text-gray-400">
                                {new Date(application.applied_at).toLocaleString()}
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs ${
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'reviewing' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {application.status}
                            </div>
                          </div>
                        ))}
                        {recentActivity.length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg">No recent activity</p>
                            <p className="text-sm">Activity will appear here as users interact with your portal</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {stats && stats.totalApplications > 0
                            ? ((stats.statusDistribution?.offered || 0) / stats.totalApplications * 100).toFixed(1)
                            : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Applications to offers
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Average Time to Hire</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">12.5</div>
                        <p className="text-xs text-muted-foreground">
                          Days from application to offer
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Most Popular Job</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold">Software Engineer</div>
                        <p className="text-xs text-muted-foreground">
                          45 applications this month
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}