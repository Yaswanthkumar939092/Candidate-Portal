'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { AdminNavigation } from '@/components/admin-navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import type { FrappeEnvironment } from '@/types/database'
import {
  Plus,
  Server,
  CheckCircle,
  XCircle,
  Loader2,
  Radio,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react'

interface User {
  id: string
  email?: string
}

export default function FrappeEnvironmentsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [environments, setEnvironments] = useState<FrappeEnvironment[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [activatingId, setActivatingId] = useState<string | null>(null)

  const [newEnv, setNewEnv] = useState({
    environment_key: 'DEV' as 'LOCAL' | 'DEV' | 'UAT' | 'PROD',
    label: '',
    frappe_url: '',
    api_key: '',
    api_secret: '',
    username: '',
    password: '',
  })

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
      await loadEnvironments()
    } catch (error) {
      console.error('Error loading page:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadEnvironments = async () => {
    try {
      const response = await fetch('/api/admin/frappe-environments')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setEnvironments(data.data || [])
    } catch (error) {
      console.error('Error loading environments:', error)
    }
  }

  const handleCreate = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/frappe-environments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEnv),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create')
      }

      setIsCreateDialogOpen(false)
      setNewEnv({
        environment_key: 'DEV',
        label: '',
        frappe_url: '',
        api_key: '',
        api_secret: '',
        username: '',
        password: '',
      })
      await loadEnvironments()
    } catch (error) {
      console.error('Error creating environment:', error)
      alert(error instanceof Error ? error.message : 'Failed to create environment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestConnection = async (envId: string) => {
    try {
      setTestingId(envId)
      const response = await fetch(`/api/admin/frappe-environments/${envId}/test-connection`, {
        method: 'POST',
      })
      const data = await response.json()

      if (data.data?.success || data.success) {
        alert(`Connection successful! Response time: ${data.data?.response_time_ms ?? '?'}ms`)
      } else {
        alert(`Connection failed: ${data.data?.error ?? data.error ?? 'Unknown error'}`)
      }

      await loadEnvironments()
    } catch (error) {
      console.error('Test connection error:', error)
      alert('Failed to test connection')
    } finally {
      setTestingId(null)
    }
  }

  const handleActivate = async (envId: string) => {
    try {
      setActivatingId(envId)
      const response = await fetch(`/api/admin/frappe-environments/${envId}/activate`, {
        method: 'POST',
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to activate')
      }

      await loadEnvironments()
    } catch (error) {
      console.error('Activate error:', error)
      alert(error instanceof Error ? error.message : 'Failed to activate environment')
    } finally {
      setActivatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading environments...</span>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Frappe Environments</h1>
                <p className="text-muted-foreground">Manage Frappe/ERPNext connections.</p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Environment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Add Frappe Environment</DialogTitle>
                    <DialogDescription>
                      Connect a new Frappe/ERPNext instance.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="env_key">Environment</Label>
                        <Select
                          value={newEnv.environment_key}
                          onValueChange={(v) =>
                            setNewEnv({ ...newEnv, environment_key: v as typeof newEnv.environment_key })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOCAL">Local</SelectItem>
                            <SelectItem value="DEV">Development</SelectItem>
                            <SelectItem value="UAT">UAT</SelectItem>
                            <SelectItem value="PROD">Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="label">Label</Label>
                        <Input
                          id="label"
                          value={newEnv.label}
                          onChange={(e) => setNewEnv({ ...newEnv, label: e.target.value })}
                          placeholder="My Dev Server"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="frappe_url">Frappe URL</Label>
                      <Input
                        id="frappe_url"
                        value={newEnv.frappe_url}
                        onChange={(e) => setNewEnv({ ...newEnv, frappe_url: e.target.value })}
                        placeholder="https://erp.example.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="api_key">API Key</Label>
                        <Input
                          id="api_key"
                          value={newEnv.api_key}
                          onChange={(e) => setNewEnv({ ...newEnv, api_key: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="api_secret">API Secret</Label>
                        <Input
                          id="api_secret"
                          type="password"
                          value={newEnv.api_secret}
                          onChange={(e) => setNewEnv({ ...newEnv, api_secret: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={newEnv.username}
                          onChange={(e) => setNewEnv({ ...newEnv, username: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newEnv.password}
                          onChange={(e) => setNewEnv({ ...newEnv, password: e.target.value })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Environment Cards */}
            {environments.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Server className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No environments configured</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add your first Frappe/ERPNext environment to get started.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Environment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {environments.map((env) => (
                  <Card key={env.id} className={env.is_active ? 'border-primary' : ''}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              env.is_active ? 'bg-green-500' : 'bg-muted-foreground'
                            }`}
                          />
                          <CardTitle className="text-lg">{env.label}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={env.is_active ? 'default' : 'secondary'}>
                            {env.environment_key}
                          </Badge>
                          {env.is_active && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription className="font-mono text-xs">
                        {env.frappe_url}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Connection Status */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last test:</span>
                          <div className="flex items-center space-x-2">
                            {env.last_connection_status === 'connected' ? (
                              <>
                                <Wifi className="w-4 h-4 text-green-600" />
                                <span className="text-green-600">Connected</span>
                              </>
                            ) : env.last_connection_status === 'failed' ? (
                              <>
                                <WifiOff className="w-4 h-4 text-destructive" />
                                <span className="text-destructive">Failed</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Not tested</span>
                              </>
                            )}
                          </div>
                        </div>

                        {env.last_connection_test_at && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Tested at:</span>
                            <span className="text-muted-foreground">
                              {new Date(env.last_connection_test_at).toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Auth method:</span>
                          <span className="text-foreground">
                            {env.api_key ? 'API Key' : env.username ? 'Username/Password' : 'None'}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(env.id)}
                            disabled={testingId === env.id}
                          >
                            {testingId === env.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Radio className="w-4 h-4 mr-2" />
                                Test Connection
                              </>
                            )}
                          </Button>

                          {!env.is_active && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleActivate(env.id)}
                              disabled={activatingId === env.id}
                            >
                              {activatingId === env.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Activating...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Set Active
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
