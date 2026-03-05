'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, getCurrentUser } from '@/lib/supabase'
import { AdminNavigation } from '@/components/admin-navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CompanyDomain } from '@/types/database'
import { Plus, Globe, Loader2, Pencil, Trash2 } from 'lucide-react'

interface User {
  id: string
  email?: string
}

export default function CompanyDomainsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [domains, setDomains] = useState<CompanyDomain[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingDomain, setEditingDomain] = useState<CompanyDomain | null>(null)

  const [formData, setFormData] = useState({
    domain: '',
    company_name: '',
    is_active: true,
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
      await loadDomains()
    } catch (error) {
      console.error('Error loading page:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/admin/company-domains')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setDomains(data.data || [])
    } catch (error) {
      console.error('Error loading domains:', error)
    }
  }

  const resetForm = () => {
    setFormData({ domain: '', company_name: '', is_active: true })
  }

  const handleCreate = async () => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/company-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to create domain')
      }

      setIsCreateOpen(false)
      resetForm()
      await loadDomains()
    } catch (error) {
      console.error('Error creating domain:', error)
      alert(error instanceof Error ? error.message : 'Failed to create domain')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (domain: CompanyDomain) => {
    setEditingDomain(domain)
    setFormData({
      domain: domain.domain,
      company_name: domain.company_name || '',
      is_active: domain.is_active,
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingDomain) return

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/admin/company-domains/${editingDomain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to update domain')
      }

      setIsEditOpen(false)
      setEditingDomain(null)
      resetForm()
      await loadDomains()
    } catch (error) {
      console.error('Error updating domain:', error)
      alert(error instanceof Error ? error.message : 'Failed to update domain')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return

    try {
      const response = await fetch(`/api/admin/company-domains/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      await loadDomains()
    } catch (error) {
      console.error('Error deleting domain:', error)
      alert('Failed to delete domain')
    }
  }

  const handleToggleActive = async (domain: CompanyDomain) => {
    try {
      const response = await fetch(`/api/admin/company-domains/${domain.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !domain.is_active }),
      })

      if (!response.ok) throw new Error('Failed to update')
      await loadDomains()
    } catch (error) {
      console.error('Error toggling domain:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading company domains...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  const DomainForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="domain">Domain</Label>
        <Input
          id="domain"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          placeholder="example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name</Label>
        <Input
          id="company_name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          placeholder="Example Inc."
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => {
            setIsCreateOpen(false)
            setIsEditOpen(false)
            resetForm()
          }}
        >
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </DialogFooter>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminNavigation />

        <div className="flex-1 ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Company Domains</h1>
                <p className="text-muted-foreground">
                  Manage email domains used for internal employee detection.
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
                    Add Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Company Domain</DialogTitle>
                    <DialogDescription>
                      Users with emails matching this domain will be flagged as internal employees.
                    </DialogDescription>
                  </DialogHeader>
                  <DomainForm onSubmit={handleCreate} submitLabel="Add Domain" />
                </DialogContent>
              </Dialog>
            </div>

            {/* Domains Table */}
            {domains.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No domains configured</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Add your company email domains to enable internal employee detection.
                  </p>
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {domains.map((domain) => (
                        <TableRow key={domain.id}>
                          <TableCell className="font-mono font-medium">{domain.domain}</TableCell>
                          <TableCell>{domain.company_name || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={domain.is_active}
                                onCheckedChange={() => handleToggleActive(domain)}
                              />
                              <Badge variant={domain.is_active ? 'default' : 'secondary'}>
                                {domain.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(domain.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(domain)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(domain.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company Domain</DialogTitle>
            <DialogDescription>Update the domain configuration.</DialogDescription>
          </DialogHeader>
          <DomainForm onSubmit={handleUpdate} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  )
}
