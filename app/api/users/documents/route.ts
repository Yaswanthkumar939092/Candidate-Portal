import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, validationErrorResponse, createdResponse } from '@/lib/utils/response'

const documentsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? Math.min(parseInt(val, 10), 50) : 20),
  type: z.enum(['resume', 'cover_letter', 'portfolio', 'certificate', 'other']).optional(),
  sort_by: z.enum(['created_at', 'name', 'type', 'size']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
})

const uploadDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(255, 'Name too long'),
  type: z.enum(['resume', 'cover_letter', 'portfolio', 'certificate', 'other']),
  file_url: z.string().url('Invalid file URL'),
  file_size: z.number().min(1, 'File size must be positive').max(10 * 1024 * 1024, 'File size too large (max 10MB)'),
  file_type: z.string().min(1, 'File type is required'),
  description: z.string().max(500, 'Description too long').optional(),
})

const updateDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required').max(255, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  is_primary: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams)

    // Validate query parameters
    const validatedParams = documentsQuerySchema.parse(queryParams)
    const { page, limit, type, sort_by, sort_order } = validatedParams

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('user_documents')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: documents, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    // Calculate storage usage
    const totalSize = documents?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0

    return successResponse({
      documents: documents || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page < Math.ceil((count || 0) / limit),
        hasPrev: page > 1,
      },
      storage: {
        used_bytes: totalSize,
        used_mb: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        limit_mb: 50, // 50MB storage limit per user
      }
    })

  } catch (error) {
    console.error('Get documents error:', error)

    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      )
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    // Validate input
    const validatedData = uploadDocumentSchema.parse(body)

    // Check storage limit (50MB per user)
    const { data: existingDocs } = await supabaseAdmin
      .from('user_documents')
      .select('file_size')
      .eq('user_id', user.id)

    const currentUsage = existingDocs?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0
    const storageLimit = 50 * 1024 * 1024 // 50MB in bytes

    if (currentUsage + validatedData.file_size > storageLimit) {
      return errorResponse(
        'Storage limit exceeded. Please delete some documents first.',
        413 // Payload Too Large
      )
    }

    // Check if setting as primary document for this type
    if (validatedData.type === 'resume') {
      // If uploading a resume, make it primary and unset other resumes
      await supabaseAdmin
        .from('user_documents')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('type', 'resume')
    }

    // Create document record
    const { data: document, error: createError } = await supabaseAdmin
      .from('user_documents')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        type: validatedData.type,
        file_url: validatedData.file_url,
        file_size: validatedData.file_size,
        file_type: validatedData.file_type,
        description: validatedData.description,
        is_primary: validatedData.type === 'resume', // Resumes are primary by default
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Failed to create document record: ${createError.message}`)
    }

    return createdResponse(document, 'Document uploaded successfully')

  } catch (error) {
    console.error('Upload document error:', error)

    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      )
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return errorResponse('Document ID is required', 400)
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(documentId)) {
      return errorResponse('Invalid document ID format', 400)
    }

    const body = await request.json()

    // Validate input
    const validatedData = updateDocumentSchema.parse(body)

    // Check if document exists and belongs to user
    const { data: existingDoc, error: fetchError } = await supabaseAdmin
      .from('user_documents')
      .select('id, type, is_primary')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingDoc) {
      return notFoundResponse('Document')
    }

    // If setting as primary, unset other primary documents of the same type
    if (validatedData.is_primary === true) {
      await supabaseAdmin
        .from('user_documents')
        .update({ is_primary: false })
        .eq('user_id', user.id)
        .eq('type', existingDoc.type)
        .neq('id', documentId)
    }

    // Update document
    const { data: updatedDocument, error: updateError } = await supabaseAdmin
      .from('user_documents')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`)
    }

    return successResponse(updatedDocument, 'Document updated successfully')

  } catch (error) {
    console.error('Update document error:', error)

    if (error instanceof z.ZodError) {
      return validationErrorResponse(
        error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      )
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return errorResponse('Document ID is required', 400)
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(documentId)) {
      return errorResponse('Invalid document ID format', 400)
    }

    // Check if document exists and belongs to user
    const { data: existingDoc, error: fetchError } = await supabaseAdmin
      .from('user_documents')
      .select('id, file_url, type')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingDoc) {
      return notFoundResponse('Document')
    }

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('user_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id)

    if (deleteError) {
      throw new Error(`Failed to delete document: ${deleteError.message}`)
    }

    // TODO: Delete the actual file from storage
    // This would be implemented in the file upload service

    return successResponse(
      { id: documentId },
      'Document deleted successfully'
    )

  } catch (error) {
    console.error('Delete document error:', error)

    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error'
    )
  }
}