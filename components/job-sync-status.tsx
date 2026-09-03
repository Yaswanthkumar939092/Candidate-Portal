'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Settings,
  ChevronDown,
  Loader2
} from 'lucide-react'

type SyncStatus = 'connected' | 'syncing' | 'error' | 'disconnected' | 'warning'

interface SyncInfo {
  status: SyncStatus
  lastSync: string | null
  nextSync: string | null
  jobsCount: number
  errors: string[]
  warnings: string[]
}

export function JobSyncStatus() {
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({
    status: 'connected',
    lastSync: '2024-01-14T10:30:00Z',
    nextSync: '2024-01-14T14:30:00Z',
    jobsCount: 47,
    errors: [],
    warnings: ['Some job descriptions contain formatting issues']
  })
  const [isManualSyncing, setIsManualSyncing] = useState(false)

  // Simulate periodic status updates
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would fetch from your API
      setSyncInfo(prev => ({
        ...prev,
        lastSync: prev.status === 'syncing' ? prev.lastSync : new Date().toISOString()
      }))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusConfig = (status: SyncStatus) => {
    switch (status) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50',
          badge: 'bg-green-100 text-green-800',
          label: 'Connected',
          description: 'Frappe sync is working properly'
        }
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          badge: 'bg-blue-100 text-blue-800',
          label: 'Syncing',
          description: 'Synchronizing data with Frappe...'
        }
      case 'error':
        return {
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          badge: 'bg-red-100 text-red-800',
          label: 'Error',
          description: 'Failed to sync with Frappe'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          badge: 'bg-yellow-100 text-yellow-800',
          label: 'Warning',
          description: 'Sync completed with warnings'
        }
      case 'disconnected':
        return {
          icon: XCircle,
          color: 'text-gray-600',
          bg: 'bg-muted',
          badge: 'bg-muted text-foreground',
          label: 'Disconnected',
          description: 'Not connected to Frappe'
        }
    }
  }

  const config = getStatusConfig(syncInfo.status)
  const StatusIcon = config.icon

  const handleManualSync = async () => {
    setIsManualSyncing(true)
    setSyncInfo(prev => ({ ...prev, status: 'syncing' }))

    try {
      // Simulate API call to trigger manual sync
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Mock successful sync
      setSyncInfo(prev => ({
        ...prev,
        status: 'connected',
        lastSync: new Date().toISOString(),
        nextSync: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        jobsCount: prev.jobsCount + Math.floor(Math.random() * 5), // Add some jobs
      }))
    } catch (error) {
      setSyncInfo(prev => ({
        ...prev,
        status: 'error',
        errors: ['Failed to connect to Frappe server']
      }))
    } finally {
      setIsManualSyncing(false)
    }
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return 'Never'

    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
    return date.toLocaleDateString()
  }

  const getNextSyncTime = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled'

    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()

    if (diff < 0) return 'Overdue'
    if (diff < 3600000) return `In ${Math.floor(diff / 60000)} minutes`
    if (diff < 86400000) return `In ${Math.floor(diff / 3600000)} hours`
    return date.toLocaleDateString()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <div className={`w-2 h-2 rounded-full ${config.bg} mr-2`}>
            <div className={`w-full h-full rounded-full ${config.color.replace('text-', 'bg-')}`} />
          </div>
          <StatusIcon className={`w-4 h-4 mr-2 ${config.color} ${
            syncInfo.status === 'syncing' ? 'animate-spin' : ''
          }`} />
          <span className="hidden sm:inline">Frappe Sync</span>
          <Badge variant="secondary" className="ml-2 text-xs">
            {syncInfo.jobsCount}
          </Badge>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>Frappe Sync Status</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="p-3">
          <Card className={config.bg}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${config.bg} rounded-full flex items-center justify-center border`}>
                  <StatusIcon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{config.label}</span>
                    <Badge className={config.badge}>
                      {syncInfo.jobsCount} jobs
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {config.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Last sync:</span>
                  <span className="font-medium">{formatTime(syncInfo.lastSync)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next sync:</span>
                  <span className="font-medium">{getNextSyncTime(syncInfo.nextSync)}</span>
                </div>
              </div>

              {(syncInfo.errors.length > 0 || syncInfo.warnings.length > 0) && (
                <div className="mt-4 space-y-2">
                  {syncInfo.errors.map((error, index) => (
                    <div key={index} className="flex items-start space-x-2 text-red-600 text-sm">
                      <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                  {syncInfo.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start space-x-2 text-yellow-600 text-sm">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleManualSync}
          disabled={isManualSyncing || syncInfo.status === 'syncing'}
          className="flex items-center space-x-2"
        >
          {isManualSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span>Sync Now</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>View Sync History</span>
        </DropdownMenuItem>

        <DropdownMenuItem className="flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span>Sync Settings</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="p-2 text-xs text-gray-500">
          <div>Auto-sync every 4 hours</div>
          <div>
            Status: {config.label} • Last updated: {formatTime(syncInfo.lastSync)}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}