import { supabaseAdmin } from '@/lib/supabase-admin'
import { z } from 'zod'

// File upload configuration
const ALLOWED_FILE_TYPES = {
  resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  cover_letter: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  portfolio: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  certificate: ['application/pdf', 'image/jpeg', 'image/png'],
  other: ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
} as const

const MAX_FILE_SIZES = {
  resume: 5 * 1024 * 1024, // 5MB
  cover_letter: 5 * 1024 * 1024, // 5MB
  portfolio: 10 * 1024 * 1024, // 10MB
  certificate: 5 * 1024 * 1024, // 5MB
  other: 10 * 1024 * 1024, // 10MB
} as const

const STORAGE_BUCKETS = {
  resume: 'resumes',
  cover_letter: 'cover-letters',
  portfolio: 'portfolios',
  certificate: 'certificates',
  other: 'documents',
} as const

// Validation schemas
const uploadFileSchema = z.object({
  file: z.any(), // File object from FormData
  userId: z.string().uuid(),
  documentType: z.enum(['resume', 'cover_letter', 'portfolio', 'certificate', 'other']),
  filename: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
})

const fileMetadataSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  lastModified: z.number(),
})

interface UploadResult {
  success: boolean
  data?: {
    id: string
    filename: string
    url: string
    publicUrl: string
    size: number
    type: string
    bucket: string
    path: string
  }
  error?: string
}

interface FileValidationResult {
  valid: boolean
  error?: string
}

class FileUploadService {
  private readonly supabase = supabaseAdmin

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    userId: string,
    file: File,
    documentType: keyof typeof ALLOWED_FILE_TYPES,
    options: {
      filename?: string
      description?: string
      replaceExisting?: boolean
    } = {}
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file, documentType)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Generate unique filename
      const filename = options.filename || file.name
      const fileExtension = filename.split('.').pop()
      const uniqueFilename = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`

      // Get storage bucket
      const bucket = STORAGE_BUCKETS[documentType]

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from(bucket)
        .upload(uniqueFilename, file, {
          cacheControl: '3600',
          upsert: options.replaceExisting || false,
        })

      if (uploadError) {
        console.error('File upload error:', uploadError)
        return { success: false, error: uploadError.message }
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path)

      // Create file record in database
      const { data: fileRecord, error: dbError } = await this.supabase
        .from('user_documents')
        .insert({
          user_id: userId,
          name: filename,
          type: documentType,
          file_url: publicUrlData.publicUrl,
          file_size: file.size,
          file_type: file.type,
          bucket_name: bucket,
          storage_path: uploadData.path,
          description: options.description,
          is_primary: documentType === 'resume', // Mark resumes as primary by default
        })
        .select()
        .single()

      if (dbError) {
        // If database insert fails, clean up the uploaded file
        await this.supabase.storage.from(bucket).remove([uploadData.path])
        console.error('Database insert error:', dbError)
        return { success: false, error: 'Failed to create file record' }
      }

      return {
        success: true,
        data: {
          id: fileRecord.id,
          filename: filename,
          url: publicUrlData.publicUrl,
          publicUrl: publicUrlData.publicUrl,
          size: file.size,
          type: file.type,
          bucket,
          path: uploadData.path,
        }
      }

    } catch (error) {
      console.error('Upload service error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      }
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    userId: string,
    files: Array<{
      file: File
      documentType: keyof typeof ALLOWED_FILE_TYPES
      filename?: string
      description?: string
    }>
  ): Promise<Array<UploadResult & { originalIndex: number }>> {
    const results: Array<UploadResult & { originalIndex: number }> = []

    for (let i = 0; i < files.length; i++) {
      const fileUpload = files[i]
      const result = await this.uploadFile(
        userId,
        fileUpload.file,
        fileUpload.documentType,
        {
          filename: fileUpload.filename,
          description: fileUpload.description,
        }
      )

      results.push({ ...result, originalIndex: i })

      // Add small delay to prevent rate limiting
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return results
  }

  /**
   * Delete a file from storage and database
   */
  async deleteFile(userId: string, fileId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get file record
      const { data: fileRecord, error: fetchError } = await this.supabase
        .from('user_documents')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError || !fileRecord) {
        return { success: false, error: 'File not found' }
      }

      // Verify ownership
      if (fileRecord.user_id !== userId) {
        return { success: false, error: 'Unauthorized' }
      }

      const record = fileRecord as any

      // Delete from storage
      const { error: storageError } = await this.supabase.storage
        .from(record.bucket_name)
        .remove([record.storage_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
        // Continue with database deletion even if storage deletion fails
      }

      // Delete database record
      const { error: dbError } = await this.supabase
        .from('user_documents')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId)

      if (dbError) {
        console.error('Database deletion error:', dbError)
        return { success: false, error: 'Failed to delete file record' }
      }

      return { success: true }

    } catch (error) {
      console.error('Delete file error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deletion error'
      }
    }
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(
    userId: string,
    fileId: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Get file record
      const { data: fileRecord, error: fetchError } = await this.supabase
        .from('user_documents')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError || !fileRecord) {
        return { success: false, error: 'File not found' }
      }

      // Verify ownership (or admin access)
      if (fileRecord.user_id !== userId) {
        // TODO: Check if user is admin
        return { success: false, error: 'Unauthorized' }
      }

      const record = fileRecord as any

      // Generate signed URL
      const { data: signedUrlData, error: urlError } = await this.supabase.storage
        .from(record.bucket_name)
        .createSignedUrl(record.storage_path, expiresIn)

      if (urlError) {
        console.error('Signed URL generation error:', urlError)
        return { success: false, error: 'Failed to generate signed URL' }
      }

      return { success: true, url: signedUrlData.signedUrl }

    } catch (error) {
      console.error('Get signed URL error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, documentType: keyof typeof ALLOWED_FILE_TYPES): FileValidationResult {
    // Check file size
    const maxSize = MAX_FILE_SIZES[documentType]
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB`
      }
    }

    // Check file type
    const allowedTypes = ALLOWED_FILE_TYPES[documentType]
    if (!allowedTypes.includes(file.type as any)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    // Check filename
    if (!file.name || file.name.length > 255) {
      return {
        valid: false,
        error: 'Invalid filename'
      }
    }

    // Basic security check - prevent dangerous filenames
    const dangerousPatterns = [
      /\.\./,
      /^\/|\/$/,
      /[<>:"|?*]/,
      /\x00/,
      /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(file.name)) {
        return {
          valid: false,
          error: 'Invalid filename characters'
        }
      }
    }

    return { valid: true }
  }

  /**
   * Check user storage quota
   */
  async checkStorageQuota(userId: string): Promise<{
    used: number
    limit: number
    available: number
    canUpload: (fileSize: number) => boolean
  }> {
    try {
      // Get user's current storage usage
      const { data: documents } = await this.supabase
        .from('user_documents')
        .select('file_size')
        .eq('user_id', userId)

      const usedBytes = documents?.reduce((total, doc) => total + (doc.file_size || 0), 0) || 0
      const limitBytes = 50 * 1024 * 1024 // 50MB limit per user
      const availableBytes = Math.max(0, limitBytes - usedBytes)

      return {
        used: usedBytes,
        limit: limitBytes,
        available: availableBytes,
        canUpload: (fileSize: number) => fileSize <= availableBytes
      }

    } catch (error) {
      console.error('Storage quota check error:', error)
      return {
        used: 0,
        limit: 50 * 1024 * 1024,
        available: 50 * 1024 * 1024,
        canUpload: () => false
      }
    }
  }

  /**
   * Generate thumbnail for image files
   */
  async generateThumbnail(
    fileId: string,
    width: number = 200,
    height: number = 200
  ): Promise<{ success: boolean; thumbnailUrl?: string; error?: string }> {
    try {
      // Get file record
      const { data: fileRecord, error: fetchError } = await this.supabase
        .from('user_documents')
        .select('*')
        .eq('id', fileId)
        .single()

      if (fetchError || !fileRecord) {
        return { success: false, error: 'File not found' }
      }

      // Check if file is an image
      if (!fileRecord.file_type.startsWith('image/')) {
        return { success: false, error: 'File is not an image' }
      }

      const record = fileRecord as any

      // Generate thumbnail URL using Supabase's transform API
      const { data: publicUrlData } = this.supabase.storage
        .from(record.bucket_name)
        .getPublicUrl(record.storage_path, {
          transform: {
            width,
            height,
            resize: 'cover',
            format: 'origin' as const,
            quality: 80
          }
        })

      return { success: true, thumbnailUrl: publicUrlData.publicUrl }

    } catch (error) {
      console.error('Thumbnail generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Clean up orphaned files (files in storage but not in database)
   */
  async cleanupOrphanedFiles(bucket: keyof typeof STORAGE_BUCKETS): Promise<{
    cleaned: number
    errors: string[]
  }> {
    try {
      const bucketName = STORAGE_BUCKETS[bucket]
      let cleaned = 0
      const errors: string[] = []

      // List all files in the bucket
      const { data: files, error: listError } = await this.supabase.storage
        .from(bucketName)
        .list()

      if (listError) {
        throw new Error(`Failed to list files: ${listError.message}`)
      }

      // Check each file against the database
      for (const file of files || []) {
        const { data: dbRecord } = await this.supabase
          .from('user_documents')
          .select('id')
          .eq('storage_path', file.name)
          .single()

        if (!dbRecord) {
          // File exists in storage but not in database - remove it
          const { error: deleteError } = await this.supabase.storage
            .from(bucketName)
            .remove([file.name])

          if (deleteError) {
            errors.push(`Failed to delete ${file.name}: ${deleteError.message}`)
          } else {
            cleaned++
            console.log(`Cleaned orphaned file: ${file.name}`)
          }
        }
      }

      return { cleaned, errors }

    } catch (error) {
      console.error('Cleanup error:', error)
      return {
        cleaned: 0,
        errors: [error instanceof Error ? error.message : 'Unknown cleanup error']
      }
    }
  }

  /**
   * Get file metadata without downloading
   */
  async getFileMetadata(fileId: string): Promise<{
    success: boolean
    metadata?: {
      name: string
      size: number
      type: string
      created_at: string
      updated_at: string
      bucket: string
      path: string
    }
    error?: string
  }> {
    try {
      const { data: fileRecord, error } = await this.supabase
        .from('user_documents')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error || !fileRecord) {
        return { success: false, error: 'File not found' }
      }

      const record = fileRecord as any
      return {
        success: true,
        metadata: {
          name: fileRecord.name,
          size: fileRecord.file_size,
          type: fileRecord.file_type,
          created_at: fileRecord.created_at,
          updated_at: fileRecord.updated_at,
          bucket: record.bucket_name,
          path: record.storage_path,
        }
      }

    } catch (error) {
      console.error('Get metadata error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService()

// Export types and constants
export type { UploadResult, FileValidationResult }
export { ALLOWED_FILE_TYPES, MAX_FILE_SIZES, STORAGE_BUCKETS }