# Backend Agent Specification
## Job Candidate Portal - Backend Development Agent

### Agent Overview
The Backend Agent is responsible for developing and maintaining the server-side logic, API endpoints, and data management for the Job Candidate Portal. This agent focuses on creating a robust, scalable backend that integrates Supabase for user management and Frappe ERPNext for job data, ensuring data consistency, security, and performance.

### Core Responsibilities

#### 1. API Development
- **RESTful APIs**: Design and implement RESTful endpoints for all application features
- **GraphQL Support**: Optional GraphQL implementation for complex data queries
- **API Documentation**: Comprehensive API documentation using OpenAPI/Swagger
- **Rate Limiting**: Implement rate limiting and request throttling
- **Caching**: Redis-based caching for improved performance

#### 2. Data Management
- **Database Design**: Design efficient database schemas for Supabase PostgreSQL
- **Data Validation**: Input validation and sanitization using Zod schemas
- **Data Migration**: Database migration scripts and version control
- **Data Synchronization**: Real-time sync between Supabase and Frappe ERPNext
- **Backup & Recovery**: Automated backup and disaster recovery procedures

#### 3. Authentication & Authorization
- **JWT Management**: Token generation, validation, and refresh mechanisms
- **OAuth Integration**: Google and LinkedIn OAuth provider integration
- **Role-Based Access Control**: RBAC implementation with fine-grained permissions
- **Session Management**: Secure session handling and timeout management
- **Multi-Factor Authentication**: MFA support for enhanced security

#### 4. Integration Management
- **Frappe ERPNext Integration**: API client for job data synchronization
- **Supabase Integration**: Database operations and real-time subscriptions
- **Third-Party Services**: Email, file storage, and notification services
- **Webhook Handling**: Incoming webhook processing and validation
- **Error Handling**: Comprehensive error handling and logging

### Technical Stack

#### Core Technologies
```typescript
// Runtime & Framework
- Node.js 20+
- TypeScript 5
- Express.js or Fastify
- Next.js API Routes

// Database & ORM
- Supabase PostgreSQL
- Prisma ORM
- Redis (caching)
- Database migrations

// Authentication & Security
- Supabase Auth
- JWT tokens
- OAuth 2.0 providers
- bcrypt for password hashing
- Helmet for security headers

// API & Documentation
- OpenAPI/Swagger
- Zod for validation
- Rate limiting middleware
- CORS configuration

// Monitoring & Logging
- Winston for logging
- Sentry for error tracking
- Prometheus for metrics
- Health check endpoints

// Development Tools
- ESLint + Prettier
- Jest for testing
- Supertest for API testing
- Docker for containerization
```

#### Project Structure
```
src/
├── api/                    # API routes
│   ├── auth/              # Authentication endpoints
│   ├── jobs/              # Job-related endpoints
│   ├── applications/      # Application management
│   ├── users/             # User management
│   ├── admin/             # Admin endpoints
│   └── webhooks/          # Webhook handlers
├── lib/                   # Core libraries
│   ├── auth.ts            # Authentication utilities
│   ├── database.ts        # Database connection
│   ├── validation.ts      # Validation schemas
│   ├── frappe-client.ts   # Frappe ERPNext client
│   ├── supabase-client.ts # Supabase client
│   └── redis.ts           # Redis client
├── middleware/            # Express middleware
│   ├── auth.ts            # Authentication middleware
│   ├── validation.ts      # Request validation
│   ├── rate-limit.ts      # Rate limiting
│   └── error-handler.ts   # Error handling
├── services/              # Business logic
│   ├── auth.service.ts    # Authentication service
│   ├── job.service.ts     # Job management service
│   ├── application.service.ts # Application service
│   ├── user.service.ts    # User management service
│   └── notification.service.ts # Notification service
├── types/                 # TypeScript definitions
├── utils/                 # Utility functions
├── config/                # Configuration files
└── tests/                 # Test files
```

### Database Schema Design

#### 1. Supabase PostgreSQL Schema
```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  location VARCHAR(255),
  bio TEXT,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'candidate',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  skills TEXT[],
  experience JSONB,
  education JSONB,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jobs table (synced from Frappe ERPNext)
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frappe_job_id VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  department VARCHAR(100),
  experience_level VARCHAR(50),
  job_type VARCHAR(50),
  salary_range JSONB,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  tags TEXT[],
  status VARCHAR(50) DEFAULT 'active',
  posted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'applied',
  cover_letter TEXT,
  resume_url TEXT,
  additional_documents JSONB,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Application status history
CREATE TABLE public.application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved jobs
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- Documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  size INTEGER,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview schedules
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER DEFAULT 60,
  type VARCHAR(50) DEFAULT 'video',
  meeting_link TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_company ON public.jobs(company);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_tags ON public.jobs USING GIN(tags);
CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_interviews_application_id ON public.interviews(application_id);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
```

#### 2. Row Level Security (RLS) Policies
```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Applications policies
CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id);

-- Saved jobs policies
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saved jobs" ON public.saved_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- Jobs are publicly readable
CREATE POLICY "Jobs are publicly readable" ON public.jobs
  FOR SELECT USING (status = 'active');

-- Admin policies
CREATE POLICY "Admins can view all data" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
```

### API Endpoints Design

#### 1. Authentication Endpoints
```typescript
// POST /api/auth/signup
interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface SignupResponse {
  user: User;
  session: Session;
  message: string;
}

// POST /api/auth/signin
interface SigninRequest {
  email: string;
  password: string;
}

interface SigninResponse {
  user: User;
  session: Session;
  message: string;
}

// POST /api/auth/signout
interface SignoutResponse {
  message: string;
}

// POST /api/auth/oauth/google
interface GoogleOAuthRequest {
  code: string;
  state?: string;
}

// POST /api/auth/oauth/linkedin
interface LinkedInOAuthRequest {
  code: string;
  state?: string;
}

// POST /api/auth/refresh
interface RefreshTokenRequest {
  refreshToken: string;
}

// POST /api/auth/forgot-password
interface ForgotPasswordRequest {
  email: string;
}

// POST /api/auth/reset-password
interface ResetPasswordRequest {
  token: string;
  password: string;
}
```

#### 2. Job Management Endpoints
```typescript
// GET /api/jobs
interface JobsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  department?: string;
  experience?: string;
  jobType?: string;
  tags?: string[];
  salaryMin?: number;
  salaryMax?: number;
  sortBy?: 'posted_at' | 'title' | 'company' | 'salary';
  sortOrder?: 'asc' | 'desc';
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// GET /api/jobs/:id
interface JobDetailResponse {
  job: Job;
  relatedJobs: Job[];
  applicationStatus?: ApplicationStatus;
}

// POST /api/jobs/:id/save
interface SaveJobResponse {
  message: string;
  saved: boolean;
}

// DELETE /api/jobs/:id/save
interface UnsaveJobResponse {
  message: string;
  saved: boolean;
}

// GET /api/jobs/saved
interface SavedJobsResponse {
  jobs: Job[];
  pagination: PaginationInfo;
}
```

#### 3. Application Management Endpoints
```typescript
// POST /api/applications
interface CreateApplicationRequest {
  jobId: string;
  coverLetter?: string;
  resumeId?: string;
  additionalDocuments?: string[];
}

interface CreateApplicationResponse {
  application: Application;
  message: string;
}

// GET /api/applications
interface ApplicationsQueryParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  jobId?: string;
  sortBy?: 'applied_at' | 'updated_at' | 'status';
  sortOrder?: 'asc' | 'desc';
}

interface ApplicationsResponse {
  applications: Application[];
  pagination: PaginationInfo;
}

// GET /api/applications/:id
interface ApplicationDetailResponse {
  application: Application;
  job: Job;
  statusHistory: ApplicationStatusHistory[];
  interviews: Interview[];
}

// PUT /api/applications/:id
interface UpdateApplicationRequest {
  status?: ApplicationStatus;
  notes?: string;
}

// DELETE /api/applications/:id
interface DeleteApplicationResponse {
  message: string;
}
```

#### 4. User Management Endpoints
```typescript
// GET /api/users/profile
interface UserProfileResponse {
  user: User;
  profile: UserProfile;
  stats: {
    totalApplications: number;
    savedJobs: number;
    documents: number;
  };
}

// PUT /api/users/profile
interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  experience?: WorkExperience[];
  education?: Education[];
}

// POST /api/users/documents
interface UploadDocumentRequest {
  name: string;
  type: 'resume' | 'cover-letter' | 'portfolio' | 'other';
  file: File;
}

interface UploadDocumentResponse {
  document: Document;
  message: string;
}

// GET /api/users/documents
interface DocumentsResponse {
  documents: Document[];
}

// DELETE /api/users/documents/:id
interface DeleteDocumentResponse {
  message: string;
}
```

#### 5. Admin Endpoints
```typescript
// GET /api/admin/dashboard
interface AdminDashboardResponse {
  stats: {
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
    activeJobs: number;
    recentApplications: number;
  };
  recentActivity: Activity[];
  systemHealth: SystemHealth;
}

// GET /api/admin/users
interface AdminUsersQueryParams {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  sortBy?: 'created_at' | 'email' | 'role';
  sortOrder?: 'asc' | 'desc';
}

interface AdminUsersResponse {
  users: User[];
  pagination: PaginationInfo;
}

// PUT /api/admin/users/:id/role
interface UpdateUserRoleRequest {
  role: 'candidate' | 'admin' | 'super_admin';
}

// GET /api/admin/applications
interface AdminApplicationsQueryParams {
  page?: number;
  limit?: number;
  status?: ApplicationStatus;
  userId?: string;
  jobId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// PUT /api/admin/applications/:id/status
interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  notes?: string;
}

// POST /api/admin/jobs/sync
interface SyncJobsResponse {
  synced: number;
  errors: string[];
  message: string;
}
```

### Service Layer Implementation

#### 1. Authentication Service
```typescript
// services/auth.service.ts
export class AuthService {
  private supabase: SupabaseClient;
  private redis: Redis;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async signUp(data: SignupRequest): Promise<SignupResponse> {
    try {
      // Validate input
      const validatedData = signupSchema.parse(data);

      // Check if user already exists
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', validatedData.email)
        .single();

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth
        .signUp({
          email: validatedData.email,
          password: validatedData.password,
        });

      if (authError) throw authError;

      // Create user profile
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .insert({
          id: authData.user!.id,
          email: validatedData.email,
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
          phone: validatedData.phone,
          role: 'candidate',
        })
        .select()
        .single();

      if (userError) throw userError;

      // Create user profile
      await this.supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user!.id,
          skills: [],
          experience: [],
          education: [],
          preferences: {},
        });

      // Log audit event
      await this.logAuditEvent({
        userId: authData.user!.id,
        action: 'user_signup',
        resourceType: 'user',
        resourceId: authData.user!.id,
        newValues: { email: validatedData.email },
      });

      return {
        user: userData,
        session: authData.session!,
        message: 'User created successfully',
      };
    } catch (error) {
      throw new Error(`Signup failed: ${error.message}`);
    }
  }

  async signIn(data: SigninRequest): Promise<SigninResponse> {
    try {
      const validatedData = signinSchema.parse(data);

      const { data: authData, error } = await this.supabase.auth
        .signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

      if (error) throw error;

      // Get user profile
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', authData.user!.id)
        .single();

      if (userError) throw userError;

      // Log audit event
      await this.logAuditEvent({
        userId: authData.user!.id,
        action: 'user_signin',
        resourceType: 'user',
        resourceId: authData.user!.id,
      });

      return {
        user: userData,
        session: authData.session!,
        message: 'Signin successful',
      };
    } catch (error) {
      throw new Error(`Signin failed: ${error.message}`);
    }
  }

  async signOut(userId: string): Promise<SignoutResponse> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) throw error;

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'user_signout',
        resourceType: 'user',
        resourceId: userId,
      });

      return { message: 'Signout successful' };
    } catch (error) {
      throw new Error(`Signout failed: ${error.message}`);
    }
  }

  async refreshToken(refreshToken: string): Promise<Session> {
    try {
      const { data, error } = await this.supabase.auth
        .refreshSession({ refresh_token: refreshToken });

      if (error) throw error;

      return data.session!;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const { error } = await this.supabase.auth
        .resetPasswordForEmail(email, {
          redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
        });

      if (error) throw error;

      return { message: 'Password reset email sent' };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    try {
      const { error } = await this.supabase.auth
        .updateUser({ password });

      if (error) throw error;

      return { message: 'Password reset successful' };
    } catch (error) {
      throw new Error(`Password reset failed: ${error.message}`);
    }
  }

  private async logAuditEvent(event: AuditEvent): Promise<void> {
    try {
      await this.supabase
        .from('audit_log')
        .insert(event);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}
```

#### 2. Job Service
```typescript
// services/job.service.ts
export class JobService {
  private supabase: SupabaseClient;
  private frappeClient: FrappeClient;
  private redis: Redis;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.frappeClient = new FrappeClient({
      url: process.env.FRAPPE_URL!,
      apiKey: process.env.FRAPPE_API_KEY!,
      apiSecret: process.env.FRAPPE_API_SECRET!,
    });
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async getJobs(params: JobsQueryParams): Promise<JobsResponse> {
    try {
      const cacheKey = `jobs:${JSON.stringify(params)}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const { page = 1, limit = 20, ...filters } = params;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,company.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.department) {
        query = query.eq('department', filters.department);
      }

      if (filters.experience) {
        query = query.eq('experience_level', filters.experience);
      }

      if (filters.jobType) {
        query = query.eq('job_type', filters.jobType);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.salaryMin) {
        query = query.gte('salary_range->min', filters.salaryMin);
      }

      if (filters.salaryMax) {
        query = query.lte('salary_range->max', filters.salaryMax);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'posted_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: jobs, error, count } = await query;

      if (error) throw error;

      const response: JobsResponse = {
        jobs: jobs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };

      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(response));

      return response;
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  async getJobById(id: string): Promise<JobDetailResponse> {
    try {
      const cacheKey = `job:${id}`;
      const cached = await this.redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const { data: job, error } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single();

      if (error) throw error;

      // Get related jobs
      const { data: relatedJobs } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('company', job.company)
        .neq('id', id)
        .eq('status', 'active')
        .limit(5);

      const response: JobDetailResponse = {
        job,
        relatedJobs: relatedJobs || [],
      };

      // Cache for 10 minutes
      await this.redis.setex(cacheKey, 600, JSON.stringify(response));

      return response;
    } catch (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }
  }

  async saveJob(userId: string, jobId: string): Promise<SaveJobResponse> {
    try {
      const { error } = await this.supabase
        .from('saved_jobs')
        .insert({
          user_id: userId,
          job_id: jobId,
        });

      if (error) throw error;

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'job_saved',
        resourceType: 'job',
        resourceId: jobId,
      });

      return { message: 'Job saved successfully', saved: true };
    } catch (error) {
      throw new Error(`Failed to save job: ${error.message}`);
    }
  }

  async unsaveJob(userId: string, jobId: string): Promise<UnsaveJobResponse> {
    try {
      const { error } = await this.supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId);

      if (error) throw error;

      return { message: 'Job unsaved successfully', saved: false };
    } catch (error) {
      throw new Error(`Failed to unsave job: ${error.message}`);
    }
  }

  async getSavedJobs(userId: string, params: PaginationParams): Promise<SavedJobsResponse> {
    try {
      const { page = 1, limit = 20 } = params;
      const offset = (page - 1) * limit;

      const { data, error, count } = await this.supabase
        .from('saved_jobs')
        .select(`
          *,
          jobs (*)
        `)
        .eq('user_id', userId)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const jobs = data?.map(item => item.jobs) || [];

      return {
        jobs,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch saved jobs: ${error.message}`);
    }
  }

  async syncJobsFromFrappe(): Promise<SyncJobsResponse> {
    try {
      // Fetch jobs from Frappe ERPNext
      const frappeJobs = await this.frappeClient.getJobs();

      let synced = 0;
      const errors: string[] = [];

      for (const frappeJob of frappeJobs) {
        try {
          // Check if job already exists
          const { data: existingJob } = await this.supabase
            .from('jobs')
            .select('id')
            .eq('frappe_job_id', frappeJob.name)
            .single();

          const jobData = {
            frappe_job_id: frappeJob.name,
            title: frappeJob.job_title,
            company: frappeJob.company,
            location: frappeJob.location,
            department: frappeJob.department,
            experience_level: frappeJob.experience_level,
            job_type: frappeJob.job_type,
            salary_range: {
              min: frappeJob.salary_min,
              max: frappeJob.salary_max,
            },
            description: frappeJob.description,
            requirements: frappeJob.requirements,
            benefits: frappeJob.benefits,
            tags: frappeJob.tags || [],
            status: frappeJob.status === 'Open' ? 'active' : 'inactive',
            posted_at: frappeJob.posted_date,
            expires_at: frappeJob.expiry_date,
          };

          if (existingJob) {
            // Update existing job
            await this.supabase
              .from('jobs')
              .update(jobData)
              .eq('id', existingJob.id);
          } else {
            // Create new job
            await this.supabase
              .from('jobs')
              .insert(jobData);
          }

          synced++;
        } catch (error) {
          errors.push(`Failed to sync job ${frappeJob.name}: ${error.message}`);
        }
      }

      // Clear cache
      await this.clearJobsCache();

      return {
        synced,
        errors,
        message: `Synced ${synced} jobs successfully`,
      };
    } catch (error) {
      throw new Error(`Job sync failed: ${error.message}`);
    }
  }

  private async clearJobsCache(): Promise<void> {
    try {
      const keys = await this.redis.keys('jobs:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Failed to clear jobs cache:', error);
    }
  }

  private async logAuditEvent(event: AuditEvent): Promise<void> {
    try {
      await this.supabase
        .from('audit_log')
        .insert(event);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}
```

#### 3. Application Service
```typescript
// services/application.service.ts
export class ApplicationService {
  private supabase: SupabaseClient;
  private redis: Redis;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async createApplication(
    userId: string,
    data: CreateApplicationRequest
  ): Promise<CreateApplicationResponse> {
    try {
      const validatedData = createApplicationSchema.parse(data);

      // Check if user already applied for this job
      const { data: existingApplication } = await this.supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .eq('job_id', validatedData.jobId)
        .single();

      if (existingApplication) {
        throw new Error('Application already exists for this job');
      }

      // Verify job exists and is active
      const { data: job, error: jobError } = await this.supabase
        .from('jobs')
        .select('id, title, company')
        .eq('id', validatedData.jobId)
        .eq('status', 'active')
        .single();

      if (jobError || !job) {
        throw new Error('Job not found or inactive');
      }

      // Create application
      const { data: application, error } = await this.supabase
        .from('applications')
        .insert({
          user_id: userId,
          job_id: validatedData.jobId,
          cover_letter: validatedData.coverLetter,
          resume_url: validatedData.resumeId,
          additional_documents: validatedData.additionalDocuments,
          status: 'applied',
        })
        .select()
        .single();

      if (error) throw error;

      // Create status history entry
      await this.supabase
        .from('application_status_history')
        .insert({
          application_id: application.id,
          status: 'applied',
          notes: 'Application submitted',
          changed_by: userId,
        });

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'application_created',
        resourceType: 'application',
        resourceId: application.id,
        newValues: {
          jobId: validatedData.jobId,
          jobTitle: job.title,
          company: job.company,
        },
      });

      return {
        application,
        message: 'Application submitted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to create application: ${error.message}`);
    }
  }

  async getApplications(
    userId: string,
    params: ApplicationsQueryParams
  ): Promise<ApplicationsResponse> {
    try {
      const { page = 1, limit = 20, ...filters } = params;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('applications')
        .select(`
          *,
          jobs (*)
        `, { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.jobId) {
        query = query.eq('job_id', filters.jobId);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'applied_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        applications: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`);
    }
  }

  async getApplicationById(
    userId: string,
    applicationId: string
  ): Promise<ApplicationDetailResponse> {
    try {
      const { data: application, error } = await this.supabase
        .from('applications')
        .select(`
          *,
          jobs (*)
        `)
        .eq('id', applicationId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Get status history
      const { data: statusHistory } = await this.supabase
        .from('application_status_history')
        .select('*')
        .eq('application_id', applicationId)
        .order('changed_at', { ascending: false });

      // Get interviews
      const { data: interviews } = await this.supabase
        .from('interviews')
        .select('*')
        .eq('application_id', applicationId)
        .order('scheduled_at', { ascending: true });

      return {
        application,
        job: application.jobs,
        statusHistory: statusHistory || [],
        interviews: interviews || [],
      };
    } catch (error) {
      throw new Error(`Failed to fetch application: ${error.message}`);
    }
  }

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
    notes?: string,
    changedBy?: string
  ): Promise<{ message: string }> {
    try {
      // Update application status
      const { error } = await this.supabase
        .from('applications')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Create status history entry
      await this.supabase
        .from('application_status_history')
        .insert({
          application_id: applicationId,
          status,
          notes,
          changed_by: changedBy,
        });

      return { message: 'Application status updated successfully' };
    } catch (error) {
      throw new Error(`Failed to update application status: ${error.message}`);
    }
  }

  async deleteApplication(
    userId: string,
    applicationId: string
  ): Promise<DeleteApplicationResponse> {
    try {
      // Verify ownership
      const { data: application, error: fetchError } = await this.supabase
        .from('applications')
        .select('id, status')
        .eq('id', applicationId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !application) {
        throw new Error('Application not found');
      }

      // Only allow deletion of applications in 'applied' status
      if (application.status !== 'applied') {
        throw new Error('Cannot delete application in current status');
      }

      // Delete application
      const { error } = await this.supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'application_deleted',
        resourceType: 'application',
        resourceId: applicationId,
      });

      return { message: 'Application deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete application: ${error.message}`);
    }
  }

  private async logAuditEvent(event: AuditEvent): Promise<void> {
    try {
      await this.supabase
        .from('audit_log')
        .insert(event);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }
}
```

### Middleware Implementation

#### 1. Authentication Middleware
```typescript
// middleware/auth.ts
export interface AuthenticatedRequest extends Request {
  user: User;
  session: Session;
}

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Verify token with Supabase
    supabase.auth.getUser(token).then(({ data, error }) => {
      if (error || !data.user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      req.user = data.user;
      req.session = data.session;
      next();
    });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function requireOwnershipOrRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const resourceUserId = req.params.userId || req.body.userId;
    
    if (req.user.id !== resourceUserId && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
}
```

#### 2. Validation Middleware
```typescript
// middleware/validation.ts
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = validatedData.body;
      req.query = validatedData.query;
      req.params = validatedData.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors,
        });
      }
      next(error);
    }
  };
}

// Validation schemas
export const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
  }),
});

export const jobSearchSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
    search: z.string().optional(),
    location: z.string().optional(),
    department: z.string().optional(),
    experience: z.string().optional(),
    jobType: z.string().optional(),
    tags: z.string().transform(str => str.split(',')).optional(),
    salaryMin: z.string().transform(Number).optional(),
    salaryMax: z.string().transform(Number).optional(),
    sortBy: z.enum(['posted_at', 'title', 'company', 'salary']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});
```

#### 3. Rate Limiting Middleware
```typescript
// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export const generalRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: 'API rate limit exceeded, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Error Handling & Logging

#### 1. Error Handler Middleware
```typescript
// middleware/error-handler.ts
export interface AppError extends Error {
  statusCode: number;
  isOperational: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    message = error.message;
    isOperational = error.isOperational;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
  });

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message,
    }),
  });
}

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const error = new CustomError(
    `Route ${req.originalUrl} not found`,
    404
  );
  next(error);
}
```

#### 2. Logging Configuration
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'candidate-portal-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger;
```

### Testing Strategy

#### 1. Unit Tests
```typescript
// tests/services/auth.service.test.ts
import { AuthService } from '../../src/services/auth.service';
import { createMockSupabaseClient } from '../mocks/supabase';

describe('AuthService', () => {
  let authService: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    authService = new AuthService();
    // Mock Supabase client
    (authService as any).supabase = mockSupabase;
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockSupabase.auth.signUp.mockResolvedValue({
        data: {
          user: { id: 'user-123' },
          session: { access_token: 'token' },
        },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'user-123', email: 'test@example.com' },
              error: null,
            }),
          }),
        }),
      });

      const result = await authService.signUp(signupData);

      expect(result.user.email).toBe('test@example.com');
      expect(result.message).toBe('User created successfully');
    });

    it('should throw error if user already exists', async () => {
      const signupData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'existing-user' },
              error: null,
            }),
          }),
        }),
      });

      await expect(authService.signUp(signupData)).rejects.toThrow(
        'User already exists'
      );
    });
  });
});
```

#### 2. Integration Tests
```typescript
// tests/api/auth.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Auth API', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.message).toBe('User created successfully');
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123',
        firstName: '',
        lastName: '',
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should sign in existing user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(credentials)
        .expect(200);

      expect(response.body.user.email).toBe(credentials.email);
      expect(response.body.session).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const invalidCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/signin')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body.error).toBe('Signin failed');
    });
  });
});
```

### Performance Monitoring

#### 1. Health Check Endpoints
```typescript
// api/health.ts
export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('system_settings')
      .select('id')
      .limit(1);

    if (error) throw error;

    // Check Redis connection
    await redis.ping();

    // Check Frappe connection
    await frappeClient.ping();

    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        frappe: 'healthy',
      },
    });
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

#### 2. Metrics Collection
```typescript
// lib/metrics.ts
import { register, Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

export const jobSyncDuration = new Histogram({
  name: 'job_sync_duration_seconds',
  help: 'Duration of job synchronization in seconds',
});

export const applicationCount = new Gauge({
  name: 'applications_total',
  help: 'Total number of applications',
  labelNames: ['status'],
});

// Middleware to collect metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
}
```

### Security Implementation

#### 1. Security Headers
```typescript
// middleware/security.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL!],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
```

#### 2. Input Sanitization
```typescript
// lib/sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input);
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Middleware to sanitize request body
export function sanitizeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
}
```

### Conclusion

The Backend Agent specification provides a comprehensive guide for developing the Job Candidate Portal's server-side infrastructure. By following these patterns and best practices, the backend will deliver a robust, secure, and scalable foundation that integrates seamlessly with Supabase and Frappe ERPNext.

Key success factors:
- **Security**: Comprehensive authentication, authorization, and input validation
- **Performance**: Efficient database queries, caching, and monitoring
- **Reliability**: Error handling, logging, and health checks
- **Scalability**: Modular architecture and horizontal scaling capabilities
- **Maintainability**: Clean code, comprehensive testing, and documentation
