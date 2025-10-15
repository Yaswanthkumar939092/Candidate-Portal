// Central export file for all API utilities and middleware

// Authentication utilities
export {
  withAuth,
  withRoles,
  withOwnership,
  withRateLimit,
  getUserFromRequest,
  isAdmin,
  combineMiddleware,
  type AuthenticatedRequest
} from './middleware/auth'

// Error handling utilities
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  handleApiError,
  createErrorResponse,
  createSuccessResponse,
  asyncHandler,
  logError,
  isOperationalError,
  isValidationError,
  isAppError,
  isZodError
} from './utils/errors'

// Response utilities
export {
  successResponse,
  successResponseWithPagination,
  createdResponse,
  noContentResponse,
  errorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  rateLimitResponse,
  serviceUnavailableResponse,
  createPaginationMeta,
  setCacheHeaders,
  setSecurityHeaders,
  setCorsHeaders,
  healthCheckResponse,
  batchOperationResponse,
  fileUploadResponse,
  exportResponse,
  type ApiResponse,
  type PaginationMeta
} from './utils/response'

// API helper utilities
export {
  getPaginationParams,
  getSortParams,
  getFilterParams,
  parseArrayParam,
  parseBooleanParam,
  parseNumberParam,
  getClientIP,
  getUserAgent,
  acceptsJSON,
  getContentType,
  isMultipartFormData,
  parseJSONBody,
  validateRequiredFields,
  sanitizeString,
  cleanObject,
  buildQueryFilters,
  generateCacheKey,
  generateRateLimitKey,
  extractAuthToken,
  isLocalhost,
  getRequestOrigin,
  isValidUUID,
  createAuditLogData,
  formatErrorForLogging
} from './utils/api'

// Validation schemas
export {
  uuidSchema,
  emailSchema,
  passwordSchema,
  paginationSchema,
  signupSchema,
  signinSchema,
  updateProfileSchema,
  jobsQuerySchema,
  createJobSchema,
  updateJobSchema,
  applicationsQuerySchema,
  createApplicationSchema,
  updateApplicationSchema,
  adminUsersQuerySchema,
  syncOptionsSchema,
  savedJobsQuerySchema,
  validateUUID,
  validateEmail,
  validatePhone,
  validateURL,
  sanitizeHTML,
  ValidationError as SchemaValidationError,
  handleValidationError
} from './validation/schemas'