'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react'

interface FrappeConfigProps {
  onNext: (data: any) => void
  initialData?: {
    url?: string
    api_key?: string
    api_secret?: string
  }
}

export function FrappeConfig({ onNext, initialData }: FrappeConfigProps) {
  const [formData, setFormData] = useState({
    url: initialData?.url || '',
    api_key: initialData?.api_key || '',
    api_secret: initialData?.api_secret || '',
  })

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const [showApiSecret, setShowApiSecret] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateUrl = (url: string) => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Clear test result when user modifies form
    if (testResult) {
      setTestResult(null)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.url.trim()) {
      newErrors.url = 'Frappe URL is required'
    } else if (!validateUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL (including http:// or https://)'
    }

    if (!formData.api_key.trim()) {
      newErrors.api_key = 'API Key is required'
    }

    if (!formData.api_secret.trim()) {
      newErrors.api_secret = 'API Secret is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const testConnection = async () => {
    if (!validateForm()) {
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // In a real implementation, this would call your backend API to test the Frappe connection
      // For now, we'll simulate the test
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock successful connection
      const mockSuccess = Math.random() > 0.3 // 70% success rate for demo

      if (mockSuccess) {
        setTestResult({
          success: true,
          message: 'Successfully connected to Frappe ERPNext! Found 15 job postings ready to sync.'
        })
      } else {
        setTestResult({
          success: false,
          message: 'Connection failed. Please check your URL and credentials. Make sure the API is enabled in your Frappe instance.'
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Connection test failed. Please try again.'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (!testResult?.success) {
      // Auto-test connection if not tested yet
      testConnection()
      return
    }

    onNext({ frappe: formData })
  }

  const handleSkip = () => {
    onNext(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Connect to Frappe ERPNext</h3>
        <p className="text-muted-foreground">
          Configure your Frappe ERPNext connection to sync job postings and manage applications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">F</span>
            </div>
            <span>Frappe ERPNext Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frappe-url">Frappe URL *</Label>
              <Input
                id="frappe-url"
                type="url"
                placeholder="https://your-frappe-site.com"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                className={errors.url ? 'border-red-500' : ''}
              />
              {errors.url && (
                <p className="text-sm text-red-600">{errors.url}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter the full URL of your Frappe ERPNext instance
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key *</Label>
              <Input
                id="api-key"
                type="text"
                placeholder="Enter your Frappe API key"
                value={formData.api_key}
                onChange={(e) => handleInputChange('api_key', e.target.value)}
                className={errors.api_key ? 'border-red-500' : ''}
              />
              {errors.api_key && (
                <p className="text-sm text-red-600">{errors.api_key}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret *</Label>
              <div className="relative">
                <Input
                  id="api-secret"
                  type={showApiSecret ? 'text' : 'password'}
                  placeholder="Enter your Frappe API secret"
                  value={formData.api_secret}
                  onChange={(e) => handleInputChange('api_secret', e.target.value)}
                  className={errors.api_secret ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                >
                  {showApiSecret ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              {errors.api_secret && (
                <p className="text-sm text-red-600">{errors.api_secret}</p>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={testing || !formData.url || !formData.api_key || !formData.api_secret}
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>

            {testResult && (
              <Alert className={testResult.success ? 'border-green-200' : 'border-red-200'}>
                <div className="flex items-start space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <AlertDescription className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                    {testResult.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="pt-4">
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">How to get your API credentials:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Log in to your Frappe ERPNext instance as an Administrator</li>
                  <li>Go to Settings → Integrations → REST API</li>
                  <li>Enable REST API if not already enabled</li>
                  <li>Go to User → [Your User] → API Access</li>
                  <li>Generate API Key and Secret</li>
                  <li>Copy and paste the credentials here</li>
                </ol>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handleSkip}>
          Skip for Now
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={testing || (!testResult?.success && !!(formData.url || formData.api_key || formData.api_secret))}
        >
          {!testResult?.success && (formData.url || formData.api_key || formData.api_secret) ? 'Test & Continue' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}