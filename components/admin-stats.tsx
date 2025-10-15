'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Briefcase,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

interface AdminStatsProps {
  stats: {
    totalUsers: number
    activeJobs: number
    totalApplications: number
    pendingApplications: number
    statusDistribution: Record<string, number>
  } | null
}

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period: string
  }
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      badge: 'bg-green-100 text-green-800'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      badge: 'bg-orange-100 text-orange-800'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-800'
    }
  }

  const colors = colorClasses[color]

  const getTrendIcon = () => {
    if (!change) return null

    switch (change.type) {
      case 'increase':
        return <TrendingUp className="w-3 h-3" />
      case 'decrease':
        return <TrendingDown className="w-3 h-3" />
      default:
        return <Minus className="w-3 h-3" />
    }
  }

  const getTrendColor = () => {
    if (!change) return ''

    switch (change.type) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {change && (
            <div className={`flex items-center space-x-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="font-medium">
                {change.value > 0 ? '+' : ''}{change.value}%
              </span>
              <span className="text-gray-500">vs {change.period}</span>
            </div>
          )}
        </div>

        {/* Additional context */}
        {title === 'Pending Reviews' && (
          <p className="text-xs text-gray-500 mt-2">
            Requires immediate attention
          </p>
        )}
        {title === 'Active Jobs' && (
          <p className="text-xs text-gray-500 mt-2">
            Currently accepting applications
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function AdminStats({ stats }: AdminStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Calculate growth rates (mock data for demonstration)
  const userGrowth = 12 // +12% from last month
  const jobGrowth = 8   // +8% from last month
  const appGrowth = 24  // +24% from last month

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: {
        value: userGrowth,
        type: 'increase' as const,
        period: 'last month'
      },
      icon: Users,
      color: 'blue' as const
    },
    {
      title: 'Active Jobs',
      value: stats.activeJobs,
      change: {
        value: jobGrowth,
        type: 'increase' as const,
        period: 'last month'
      },
      icon: Briefcase,
      color: 'green' as const
    },
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      change: {
        value: appGrowth,
        type: 'increase' as const,
        period: 'last month'
      },
      icon: FileText,
      color: 'purple' as const
    },
    {
      title: 'Pending Reviews',
      value: stats.pendingApplications,
      change: {
        value: -5,
        type: 'decrease' as const,
        period: 'last week'
      },
      icon: Calendar,
      color: 'orange' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Application Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Application Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.statusDistribution).map(([status, count]) => {
                const percentage = stats.totalApplications > 0
                  ? ((count / stats.totalApplications) * 100).toFixed(1)
                  : '0'

                const statusColors = {
                  pending: 'bg-yellow-400',
                  reviewing: 'bg-blue-400',
                  interviewing: 'bg-purple-400',
                  offered: 'bg-green-400',
                  rejected: 'bg-red-400',
                  withdrawn: 'bg-gray-400'
                }

                return (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          statusColors[status as keyof typeof statusColors] || 'bg-gray-400'
                        }`}
                      />
                      <span className="capitalize font-medium">{status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">{count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Key Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    {stats.totalApplications > 0
                      ? ((stats.statusDistribution.offered || 0) / stats.totalApplications * 100).toFixed(1)
                      : '0'}%
                  </div>
                  <div className="text-xs text-gray-500">Applications to offers</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Rate</span>
                <div className="text-right">
                  <div className="text-lg font-semibold">89.2%</div>
                  <div className="text-xs text-gray-500">Within 48 hours</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg. Time to Hire</span>
                <div className="text-right">
                  <div className="text-lg font-semibold">14</div>
                  <div className="text-xs text-gray-500">Days</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border">
              <div className="font-medium text-sm">Sync Frappe Data</div>
              <div className="text-xs text-gray-500">Last synced 2 hours ago</div>
            </button>

            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border">
              <div className="font-medium text-sm">Export Applications</div>
              <div className="text-xs text-gray-500">Download CSV report</div>
            </button>

            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border">
              <div className="font-medium text-sm">Backup Settings</div>
              <div className="text-xs text-gray-500">Create configuration backup</div>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}