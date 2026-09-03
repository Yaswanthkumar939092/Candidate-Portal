'use client'

import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { FeatureFlag, FeatureFlagUpdate } from '@/types/database'
import { Edit, Trash2, Percent, Tag } from 'lucide-react'

interface FeatureToggleProps {
  flag: FeatureFlag
  onUpdate: (id: string, updates: FeatureFlagUpdate) => Promise<void>
  onDelete?: (id: string) => Promise<void>
  isUpdating?: boolean
  className?: string
}

export function FeatureToggle({
  flag,
  onUpdate,
  onDelete,
  isUpdating = false,
  className = ""
}: FeatureToggleProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editData, setEditData] = useState<Partial<FeatureFlagUpdate>>({
    name: flag.name,
    description: flag.description || '',
    is_enabled: flag.is_enabled,
    value_type: flag.value_type,
    tags: flag.tags || [],
    rollout_percentage: flag.rollout_percentage,
  })

  const handleToggle = async (enabled: boolean) => {
    await onUpdate(flag.id, { is_enabled: enabled })
  }

  const handleRolloutChange = async (percentage: number[]) => {
    await onUpdate(flag.id, { rollout_percentage: percentage[0] })
  }

  const handleEditSubmit = async () => {
    await onUpdate(flag.id, editData)
    setIsEditDialogOpen(false)
  }

  const handleDelete = async () => {
    if (onDelete && window.confirm(`Are you sure you want to delete the feature flag "${flag.name}"?`)) {
      await onDelete(flag.id)
    }
  }

  const getValueColor = (valueType: string) => {
    switch (valueType) {
      case 'boolean': return 'bg-blue-100 text-blue-800'
      case 'string': return 'bg-green-100 text-green-800'
      case 'number': return 'bg-purple-100 text-purple-800'
      case 'json': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnabledStatus = () => {
    if (!flag.is_enabled) {
      return { color: 'bg-destructive/10 text-destructive', text: 'Disabled' }
    }
    if (flag.rollout_percentage < 100) {
      return { color: 'bg-warning-bg text-warning', text: `${flag.rollout_percentage}% Rollout` }
    }
    return { color: 'bg-success-bg text-success-text', text: 'Enabled' }
  }

  const status = getEnabledStatus()

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg font-semibold">{flag.name}</CardTitle>
              <Badge className={`text-xs ${status.color}`}>
                {status.text}
              </Badge>
              <Badge variant="outline" className={`text-xs ${getValueColor(flag.value_type)}`}>
                {flag.value_type}
              </Badge>
            </div>
            <CardDescription className="text-sm">
              {flag.description || 'No description provided'}
            </CardDescription>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{flag.key}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={flag.is_enabled}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tags */}
        {flag.tags && flag.tags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {flag.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rollout Percentage */}
        {flag.is_enabled && flag.rollout_percentage < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Percent className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Rollout Percentage</Label>
              </div>
              <span className="text-sm font-medium">{flag.rollout_percentage}%</span>
            </div>
            <Slider
              value={[flag.rollout_percentage]}
              onValueChange={handleRolloutChange}
              max={100}
              step={5}
              className="w-full"
              disabled={isUpdating}
            />
          </div>
        )}

        {/* Default Value */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Default Value</Label>
          <div className="text-sm text-muted-foreground font-mono bg-gray-50 p-2 rounded border">
            {typeof flag.default_value === 'object'
              ? JSON.stringify(flag.default_value)
              : String(flag.default_value)
            }
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Updated {new Date(flag.updated_at).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Edit Feature Flag</DialogTitle>
                  <DialogDescription>
                    Update the settings for the {flag.name} feature flag.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="value_type">Value Type</Label>
                      <Select
                        value={editData.value_type}
                        onValueChange={(value) => setEditData({ ...editData, value_type: value as FeatureFlag['value_type'] })}
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
                        value={editData.rollout_percentage}
                        onChange={(e) => setEditData({ ...editData, rollout_percentage: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={editData.tags?.join(', ') || ''}
                      onChange={(e) => setEditData({
                        ...editData,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      })}
                      placeholder="authentication, oauth, users"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditSubmit} disabled={isUpdating}>
                    {isUpdating ? 'Updating...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Simple toggle component for inline use
interface SimpleFeatureToggleProps {
  flag: FeatureFlag
  onToggle: (enabled: boolean) => Promise<void>
  isUpdating?: boolean
  showLabel?: boolean
  size?: 'sm' | 'default' | 'lg'
}

export function SimpleFeatureToggle({
  flag,
  onToggle,
  isUpdating = false,
  showLabel = true,
  size = 'default'
}: SimpleFeatureToggleProps) {
  const sizeClasses = {
    sm: 'text-sm',
    default: '',
    lg: 'text-lg'
  }

  return (
    <div className={`flex items-center space-x-3 ${sizeClasses[size]}`}>
      {showLabel && (
        <div className="flex-1">
          <div className="font-medium">{flag.name}</div>
          {flag.description && (
            <div className="text-sm text-muted-foreground">{flag.description}</div>
          )}
        </div>
      )}
      <Switch
        checked={flag.is_enabled}
        onCheckedChange={onToggle}
        disabled={isUpdating}
        className="data-[state=checked]:bg-primary"
      />
    </div>
  )
}