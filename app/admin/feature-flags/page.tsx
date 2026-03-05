'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { AdminNavigation } from '@/components/admin-navigation'
import { FeatureToggle } from '@/components/feature-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeatureFlag, FeatureFlagInsert, FeatureFlagUpdate } from '@/types/database'
import {
  Plus,
  Search,
  Filter,
  Settings,
  ToggleLeft,
  ToggleRight,
  Zap,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Tag
} from 'lucide-react'

interface User {
  id: string
  email?: string
}

interface FeatureFlagStats {
  total: number
  enabled: number
  disabled: number
  rollouts: number
}

export default function FeatureFlagsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [filteredFlags, setFilteredFlags] = useState<FeatureFlag[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [filterTag, setFilterTag] = useState<string>('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [stats, setStats] = useState<FeatureFlagStats>({ total: 0, enabled: 0, disabled: 0, rollouts: 0 })

  // New feature flag form data
  const [newFlagData, setNewFlagData] = useState<Partial<FeatureFlagInsert>>({
    key: '',
    name: '',
    description: '',
    is_enabled: false,
    default_value: false,
    value_type: 'boolean',
    tags: [],
    rollout_percentage: 100,
  })

  useEffect(() => {
    checkUserAndLoadData()
  }, [])

  useEffect(() => {
    filterFlags()
  }, [featureFlags, searchTerm, filterStatus, filterTag])

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
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
      await loadFeatureFlags()

    } catch (error) {
      console.error('Error loading page:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadFeatureFlags = async () => {
    try {
      const response = await fetch('/api/admin/feature-flags', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch feature flags')
      }

      const data = await response.json()
      if (data.success && data.featureFlags) {
        setFeatureFlags(data.featureFlags)
        calculateStats(data.featureFlags)
      }
    } catch (error) {
      console.error('Error loading feature flags:', error)
    }
  }

  const calculateStats = (flags: FeatureFlag[]) => {
    const stats = {
      total: flags.length,
      enabled: flags.filter(f => f.is_enabled).length,
      disabled: flags.filter(f => !f.is_enabled).length,
      rollouts: flags.filter(f => f.is_enabled && f.rollout_percentage < 100).length,
    }
    setStats(stats)
  }

  const filterFlags = () => {
    let filtered = featureFlags

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(flag =>
        flag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flag.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flag.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(flag =>
        filterStatus === 'enabled' ? flag.is_enabled : !flag.is_enabled
      )
    }

    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter(flag =>
        flag.tags?.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()))
      )
    }

    setFilteredFlags(filtered)
  }

  const handleCreateFlag = async () => {
    try {
      setIsUpdating(true)

      if (!newFlagData.key || !newFlagData.name) {
        alert('Key and name are required')
        return
      }

      const response = await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlagData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create feature flag')
      }

      const data = await response.json()
      if (data.success && data.featureFlag) {
        setFeatureFlags(prev => [...prev, data.featureFlag])
        setIsCreateDialogOpen(false)
        setNewFlagData({
          key: '',
          name: '',
          description: '',
          is_enabled: false,
          default_value: false,
          value_type: 'boolean',
          tags: [],
          rollout_percentage: 100,
        })
      }
    } catch (error) {
      console.error('Error creating feature flag:', error)
      alert(error instanceof Error ? error.message : 'Failed to create feature flag')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateFlag = async (id: string, updates: FeatureFlagUpdate) => {
    try {
      setIsUpdating(true)

      const response = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update feature flag')
      }

      const data = await response.json()
      if (data.success && data.featureFlag) {
        setFeatureFlags(prev =>
          prev.map(flag => flag.id === id ? data.featureFlag : flag)
        )
      }
    } catch (error) {
      console.error('Error updating feature flag:', error)
      alert('Failed to update feature flag')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteFlag = async (id: string) => {
    try {
      setIsUpdating(true)

      const response = await fetch(`/api/admin/feature-flags/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete feature flag')
      }

      setFeatureFlags(prev => prev.filter(flag => flag.id !== id))
    } catch (error) {
      console.error('Error deleting feature flag:', error)
      alert('Failed to delete feature flag')
    } finally {
      setIsUpdating(false)
    }
  }

  const getAllTags = () => {
    const tags = new Set<string>()
    featureFlags.forEach(flag => {
      flag.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading feature flags...</span>
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
                <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
                <p className="text-gray-600">Manage feature flags and experimental features.</p>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Flag
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Feature Flag</DialogTitle>
                    <DialogDescription>
                      Create a new feature flag to control application functionality.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="key">Key *</Label>
                        <Input
                          id="key"
                          value={newFlagData.key || ''}
                          onChange={(e) => setNewFlagData({ ...newFlagData, key: e.target.value })}
                          placeholder="oauth_login"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={newFlagData.name || ''}
                          onChange={(e) => setNewFlagData({ ...newFlagData, name: e.target.value })}
                          placeholder="OAuth Login"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newFlagData.description || ''}
                        onChange={(e) => setNewFlagData({ ...newFlagData, description: e.target.value })}
                        placeholder="Enable OAuth login with Google and LinkedIn"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="value_type">Value Type</Label>
                        <Select
                          value={newFlagData.value_type}
                          onValueChange={(value) => setNewFlagData({ ...newFlagData, value_type: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rollout">Rollout %</Label>
                        <Input
                          id="rollout"
                          type="number"
                          min="0"
                          max="100"
                          value={newFlagData.rollout_percentage}
                          onChange={(e) => setNewFlagData({ ...newFlagData, rollout_percentage: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={newFlagData.tags?.join(', ') || ''}
                        onChange={(e) => setNewFlagData({
                          ...newFlagData,
                          tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                        })}
                        placeholder="authentication, oauth, users"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFlag} disabled={isUpdating}>
                      {isUpdating ? 'Creating...' : 'Create Flag'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Flags</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.enabled}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disabled</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.disabled}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rollouts</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.rollouts}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Search flags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="min-w-[150px]">
                    <Label htmlFor="status">Status</Label>
                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-[150px]">
                    <Label htmlFor="tag">Tag</Label>
                    <Select value={filterTag} onValueChange={setFilterTag}>
                      <SelectTrigger>
                        <SelectValue placeholder="All tags" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All tags</SelectItem>
                        {getAllTags().map(tag => (
                          <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Flags List */}
            <div className="space-y-4">
              {filteredFlags.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ToggleLeft className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No feature flags found</h3>
                    <p className="text-gray-500 text-center mb-4">
                      {featureFlags.length === 0
                        ? "Get started by creating your first feature flag."
                        : "Try adjusting your filters or search term."
                      }
                    </p>
                    {featureFlags.length === 0 && (
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Feature Flag
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredFlags.map(flag => (
                  <FeatureToggle
                    key={flag.id}
                    flag={flag}
                    onUpdate={handleUpdateFlag}
                    onDelete={handleDeleteFlag}
                    isUpdating={isUpdating}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}