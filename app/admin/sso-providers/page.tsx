'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { AdminNavigation } from '@/components/admin-navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import type { SSOProvider } from '@/types/database'
import { Plus, Shield, Loader2, Pencil, Trash2, KeyRound } from 'lucide-react'

interface User {
  id: string
  email?: string
}

const PROVIDER_TYPE_LABELS: Record<string, string> = {
  saml: 'SAML',
  oidc: 'OpenID Connect',
  frappe_sso: 'Frappe SSO',
}

export default function SSOProvidersPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [providers, setProviders] = useState<SSOProvider[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    provider_type: 'frappe_sso' as 'saml' | 'oidc' | 'frappe_sso',
    name: '',
    is_enabled: false,
    config_json: '{\n  "frappe_url": "",\n  "client_id": "",\n  "client_secret": ""\n}',
    email_domain_restriction: '',
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
      await loadProviders()
    } catch (error) {
      console.error('Error loading page:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadProviders = async () => {
    try {
      const response = await fetch('/api/admin/sso-providers')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setProviders(data.data || [])
    } catch (error) {
      console.error('Error loading SSO providers:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      provider_type: 'frappe_sso',
      name: '',
      is_enabled: false,
      config_json:
        '{\n  "frappe_url": "",\n  "client_id": "",\n  "client_secret": ""\n}',
      email_domain_restriction: '',
    })
  }

  const handleCreate = async () => {
    try {
      setIsSubmitting(true)

      let config = {}
      try {
        config = JSON.parse(formData.config_json)
      } catch {
        alert('Invalid JSON in config field')
        return
      }

      const emailDomains = formData.email_domain_restriction
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)

      const response = await fetch('/api/admin/sso-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_type: formData.provider_type,
          name: formData.name,
          is_enabled: formData.is_enabled,
          config,
          email_domain_restriction: emailDomains,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create provider')
      }

      setIsCreateOpen(false)
      resetForm()
      await loadProviders()
    } catch (error) {
      console.error('Error creating provider:', error)
      alert(error instanceof Error ? error.message : 'Failed to create provider')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleEnabled = async (provider: SSOProvider) => {
    try {
      const response = await fetch(`/api/admin/sso-providers/${provider.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !provider.is_enabled }),
      })

      if (!response.ok) throw new Error('Failed to update')
      await loadProviders()
    } catch (error) {
      console.error('Error toggling provider:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this SSO provider?')) return

    try {
      const response = await fetch(`/api/admin/sso-providers/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')
      await loadProviders()
    } catch (error) {
      console.error('Error deleting provider:', error)
      alert('Failed to delete SSO provider')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading SSO providers...</span>
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
                <h1 className="text-3xl font-bold text-foreground">SSO Providers</h1>
                <p className="text-muted-foreground">
                  Configure Single Sign-On providers for authentication.
                </p>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      resetForm()
                      setIsCreateOpen(true)
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Add SSO Provider</DialogTitle>
                    <DialogDescription>
                      Configure a new Single Sign-On provider.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="provider_type">Provider Type</Label>
                        <Select
                          value={formData.provider_type}
                          onValueChange={(v) =>
                            setFormData({ ...formData, provider_type: v as typeof formData.provider_type })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="frappe_sso">Frappe SSO</SelectItem>
                            <SelectItem value="oidc">OpenID Connect</SelectItem>
                            <SelectItem value="saml">SAML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Company Frappe SSO"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="config">Configuration (JSON)</Label>
                      <Textarea
                        id="config"
                        value={formData.config_json}
                        onChange={(e) =>
                          setFormData({ ...formData, config_json: e.target.value })
                        }
                        className="font-mono text-sm"
                        rows={6}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="domains">Email Domain Restriction (comma-separated)</Label>
                      <Input
                        id="domains"
                        value={formData.email_domain_restriction}
                        onChange={(e) =>
                          setFormData({ ...formData, email_domain_restriction: e.target.value })
                        }
                        placeholder="example.com, company.org"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave empty to allow all domains.
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_enabled"
                        checked={formData.is_enabled}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, is_enabled: checked })
                        }
                      />
                      <Label htmlFor="is_enabled">Enable immediately</Label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Provider'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Provider Cards */}
            {providers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No SSO providers configured
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add an SSO provider to enable single sign-on for your users.
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Provider
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {providers.map((provider) => {
                  const config = provider.config as Record<string, unknown>
                  return (
                    <Card key={provider.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <KeyRound className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <CardTitle className="text-lg">{provider.name}</CardTitle>
                              <CardDescription>
                                {PROVIDER_TYPE_LABELS[provider.provider_type] || provider.provider_type}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Switch
                              checked={provider.is_enabled}
                              onCheckedChange={() => handleToggleEnabled(provider)}
                            />
                            <Badge variant={provider.is_enabled ? 'default' : 'secondary'}>
                              {provider.is_enabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Config display */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {typeof config === 'object' &&
                              config !== null &&
                              Object.entries(config).map(([key, value]) => (
                                <div key={key}>
                                  <span className="text-muted-foreground">{key}: </span>
                                  <span className="font-mono text-foreground">
                                    {key.toLowerCase().includes('secret') || key.toLowerCase().includes('password')
                                      ? '********'
                                      : String(value)}
                                  </span>
                                </div>
                              ))}
                          </div>

                          {/* Domain restrictions */}
                          {provider.email_domain_restriction &&
                            provider.email_domain_restriction.length > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Domain restriction: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {provider.email_domain_restriction.map((domain) => (
                                    <Badge key={domain} variant="outline">
                                      {domain}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* SSO URL */}
                          <div className="text-sm pt-2 border-t border-border">
                            <span className="text-muted-foreground">Login URL: </span>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              /api/auth/sso/{provider.id}
                            </code>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end space-x-2 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(provider.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
