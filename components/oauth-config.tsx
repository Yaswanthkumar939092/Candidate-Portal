'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeatureGate, useFeatureFlag } from '@/lib/contexts/feature-flags'
import { Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'

interface OAuthConfigProps {
  onNext: (data: any) => void
  initialData?: {
    google_client_id?: string
    google_client_secret?: string
    linkedin_client_id?: string
    linkedin_client_secret?: string
    google_enabled?: boolean
    linkedin_enabled?: boolean
  }
}

export function OAuthConfig({ onNext, initialData }: OAuthConfigProps) {
  const [formData, setFormData] = useState({
    google_client_id: initialData?.google_client_id || '',
    google_client_secret: initialData?.google_client_secret || '',
    google_enabled: initialData?.google_enabled ?? true,
    linkedin_client_id: initialData?.linkedin_client_id || '',
    linkedin_client_secret: initialData?.linkedin_client_secret || '',
    linkedin_enabled: initialData?.linkedin_enabled ?? true,
  })

  const [showSecrets, setShowSecrets] = useState({
    google: false,
    linkedin: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const toggleSecretVisibility = (provider: 'google' | 'linkedin') => {
    setShowSecrets(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Validate Google OAuth if enabled
    if (formData.google_enabled) {
      if (!formData.google_client_id.trim()) {
        newErrors.google_client_id = 'Google Client ID is required when Google OAuth is enabled'
      }
      if (!formData.google_client_secret.trim()) {
        newErrors.google_client_secret = 'Google Client Secret is required when Google OAuth is enabled'
      }
    }

    // Validate LinkedIn OAuth if enabled
    if (formData.linkedin_enabled) {
      if (!formData.linkedin_client_id.trim()) {
        newErrors.linkedin_client_id = 'LinkedIn Client ID is required when LinkedIn OAuth is enabled'
      }
      if (!formData.linkedin_client_secret.trim()) {
        newErrors.linkedin_client_secret = 'LinkedIn Client Secret is required when LinkedIn OAuth is enabled'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onNext({ oauth: formData })
  }

  const handleSkip = () => {
    onNext()
  }

  const isFormValid = () => {
    if (!formData.google_enabled && !formData.linkedin_enabled) {
      return true // Can skip all OAuth providers
    }

    if (formData.google_enabled && (!formData.google_client_id || !formData.google_client_secret)) {
      return false
    }

    if (formData.linkedin_enabled && (!formData.linkedin_client_id || !formData.linkedin_client_secret)) {
      return false
    }

    return true
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">OAuth Provider Setup</h3>
        <p className="text-muted-foreground">
          Configure social login options for your job portal users.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="google" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="google" className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span>Google</span>
            </TabsTrigger>
            <TabsTrigger value="linkedin" className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full" />
              <span>LinkedIn</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 font-bold text-sm">G</span>
                    </div>
                    <span>Google OAuth Configuration</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="google-enabled" className="text-sm">Enable Google Login</Label>
                    <Switch
                      id="google-enabled"
                      checked={formData.google_enabled}
                      onCheckedChange={(checked) => handleInputChange('google_enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.google_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="google-client-id">Client ID *</Label>
                      <Input
                        id="google-client-id"
                        type="text"
                        placeholder="123456789-abcdefghijklmnop.apps.googleusercontent.com"
                        value={formData.google_client_id}
                        onChange={(e) => handleInputChange('google_client_id', e.target.value)}
                        className={errors.google_client_id ? 'border-red-500' : ''}
                      />
                      {errors.google_client_id && (
                        <p className="text-sm text-red-600">{errors.google_client_id}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="google-client-secret">Client Secret *</Label>
                      <div className="relative">
                        <Input
                          id="google-client-secret"
                          type={showSecrets.google ? 'text' : 'password'}
                          placeholder="Enter your Google OAuth client secret"
                          value={formData.google_client_secret}
                          onChange={(e) => handleInputChange('google_client_secret', e.target.value)}
                          className={errors.google_client_secret ? 'border-red-500 pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => toggleSecretVisibility('google')}
                        >
                          {showSecrets.google ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      {errors.google_client_secret && (
                        <p className="text-sm text-red-600">{errors.google_client_secret}</p>
                      )}
                    </div>

                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Redirect URI for Google Console:</strong><br />
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/auth/callback/google
                        </code>
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {!formData.google_enabled && (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>Google OAuth is disabled. Users won't be able to sign in with Google.</p>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How to setup Google OAuth:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
                    <li>Create a new project or select an existing one</li>
                    <li>Enable the Google+ API</li>
                    <li>Go to "Credentials" and create OAuth 2.0 Client IDs</li>
                    <li>Set the redirect URI as shown above</li>
                    <li>Copy the Client ID and Client Secret here</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="linkedin" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">in</span>
                    </div>
                    <span>LinkedIn OAuth Configuration</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="linkedin-enabled" className="text-sm">Enable LinkedIn Login</Label>
                    <Switch
                      id="linkedin-enabled"
                      checked={formData.linkedin_enabled}
                      onCheckedChange={(checked) => handleInputChange('linkedin_enabled', checked)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.linkedin_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin-client-id">Client ID *</Label>
                      <Input
                        id="linkedin-client-id"
                        type="text"
                        placeholder="86abcdefghijklmn"
                        value={formData.linkedin_client_id}
                        onChange={(e) => handleInputChange('linkedin_client_id', e.target.value)}
                        className={errors.linkedin_client_id ? 'border-red-500' : ''}
                      />
                      {errors.linkedin_client_id && (
                        <p className="text-sm text-red-600">{errors.linkedin_client_id}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="linkedin-client-secret">Client Secret *</Label>
                      <div className="relative">
                        <Input
                          id="linkedin-client-secret"
                          type={showSecrets.linkedin ? 'text' : 'password'}
                          placeholder="Enter your LinkedIn OAuth client secret"
                          value={formData.linkedin_client_secret}
                          onChange={(e) => handleInputChange('linkedin_client_secret', e.target.value)}
                          className={errors.linkedin_client_secret ? 'border-red-500 pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                          onClick={() => toggleSecretVisibility('linkedin')}
                        >
                          {showSecrets.linkedin ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      {errors.linkedin_client_secret && (
                        <p className="text-sm text-red-600">{errors.linkedin_client_secret}</p>
                      )}
                    </div>

                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Redirect URI for LinkedIn App:</strong><br />
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                          {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/api/auth/callback/linkedin
                        </code>
                      </AlertDescription>
                    </Alert>
                  </>
                )}

                {!formData.linkedin_enabled && (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>LinkedIn OAuth is disabled. Users won't be able to sign in with LinkedIn.</p>
                  </div>
                )}

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">How to setup LinkedIn OAuth:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://www.linkedin.com/developers/" target="_blank" rel="noopener noreferrer" className="underline">LinkedIn Developers</a></li>
                    <li>Create a new app or select an existing one</li>
                    <li>Add your company information and verify your company</li>
                    <li>In "Auth" tab, add the redirect URL shown above</li>
                    <li>Request access to "Sign In with LinkedIn" product</li>
                    <li>Copy the Client ID and Client Secret here</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {!formData.google_enabled && !formData.linkedin_enabled && (
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Both OAuth providers are disabled. Users will only be able to register with email and password.
              This is fine, but you may want to enable at least one OAuth provider for better user experience.
            </AlertDescription>
          </Alert>
        )}
      </form>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={handleSkip}>
          Skip for Now
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!isFormValid()}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}