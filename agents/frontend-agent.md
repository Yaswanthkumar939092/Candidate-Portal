# Frontend Agent Specification
## Job Candidate Portal - Frontend Development Agent

### Agent Overview
The Frontend Agent is responsible for developing and maintaining the user interface of the Job Candidate Portal using Next.js 15, React 19, and Tailwind CSS 4. This agent focuses on creating responsive, accessible, and performant user interfaces that provide an excellent user experience for job seekers and administrators.

### Core Responsibilities

#### 1. Component Development
- **UI Components**: Create reusable components using Shadcn/ui and custom components
- **Responsive Design**: Ensure mobile-first responsive design across all screen sizes
- **Accessibility**: Implement WCAG 2.1 AA compliance
- **Performance**: Optimize components for fast rendering and minimal bundle size

#### 2. Page Development
- **Job Discovery**: Home page with job recommendations and search functionality
- **Job Details**: Comprehensive job description pages with breadcrumb navigation
- **Application Management**: Application tracking and status management
- **User Profile**: Profile management and document upload
- **Admin Panel**: Administrative interface for system management
- **Settings**: User preferences and account management

#### 3. State Management
- **React Context**: Global state management for user authentication and preferences
- **Local State**: Component-level state management using React hooks
- **Form Management**: React Hook Form integration for form handling
- **Data Fetching**: SWR or React Query for server state management

#### 4. Integration
- **Supabase Client**: Authentication and real-time data integration
- **Frappe API**: Job data fetching and synchronization
- **OAuth Providers**: Google and LinkedIn authentication flows
- **File Upload**: Document management and storage integration

### Technical Stack

#### Core Technologies
```typescript
// Framework & Runtime
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Node.js 20+

// Styling & UI
- Tailwind CSS 4
- Shadcn/ui components
- Lucide React icons
- Custom design system

// State Management
- React Context API
- React Hook Form
- SWR/React Query
- Zustand (if needed)

// Authentication
- Supabase Auth
- NextAuth.js (if needed)
- OAuth providers (Google, LinkedIn)

// Development Tools
- ESLint + Prettier
- TypeScript strict mode
- Husky pre-commit hooks
- Storybook (component documentation)
```

#### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── admin/             # Admin panel routes
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Shadcn/ui components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── lib/                  # Utility functions
│   ├── auth.ts           # Authentication utilities
│   ├── api.ts            # API client
│   ├── utils.ts          # General utilities
│   └── validations.ts    # Form validations
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── constants/            # Application constants
```

### Key Features Implementation

#### 1. Job Discovery & Search
```typescript
// Job search with advanced filtering
interface JobSearchFilters {
  location: string;
  department: string;
  experience: string;
  country: string;
  tags: string[];
  salaryRange: [number, number];
  jobType: 'full-time' | 'part-time' | 'contract' | 'remote';
}

// Job card component
interface JobCardProps {
  job: Job;
  onSave: (jobId: string) => void;
  onApply: (jobId: string) => void;
  onShare: (jobId: string) => void;
}
```

#### 2. Application Management
```typescript
// Application status tracking
type ApplicationStatus = 
  | 'applied' 
  | 'in-review' 
  | 'interview' 
  | 'offer' 
  | 'rejected' 
  | 'withdrawn';

interface Application {
  id: string;
  jobId: string;
  userId: string;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  documents: Document[];
  interviewSchedule?: InterviewSchedule;
}
```

#### 3. User Profile & Documents
```typescript
// Document management
interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover-letter' | 'portfolio' | 'other';
  url: string;
  uploadedAt: Date;
  size: number;
}

// User profile
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills: string[];
  experience: WorkExperience[];
  education: Education[];
  documents: Document[];
}
```

#### 4. Admin Panel
```typescript
// Admin dashboard
interface AdminDashboard {
  totalUsers: number;
  totalApplications: number;
  totalJobs: number;
  recentActivity: Activity[];
  systemHealth: SystemHealth;
}

// User management
interface UserManagement {
  users: User[];
  roles: Role[];
  permissions: Permission[];
}
```

### Component Architecture

#### 1. Layout Components
```typescript
// Main layout with navigation
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}

// Dashboard layout with sidebar
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <DashboardHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

#### 2. Feature Components
```typescript
// Job search component
export function JobSearch() {
  const [filters, setFilters] = useState<JobSearchFilters>({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchFilters: JobSearchFilters) => {
    setLoading(true);
    try {
      const results = await searchJobs(searchFilters);
      setJobs(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <SearchFilters 
        filters={filters} 
        onChange={setFilters} 
        onSearch={handleSearch} 
      />
      <JobList jobs={jobs} loading={loading} />
    </div>
  );
}

// Application tracking component
export function ApplicationTracking() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');

  const filteredApplications = applications.filter(app => 
    statusFilter === 'all' || app.status === statusFilter
  );

  return (
    <div className="space-y-4">
      <ApplicationFilters 
        statusFilter={statusFilter} 
        onStatusChange={setStatusFilter} 
      />
      <ApplicationList applications={filteredApplications} />
    </div>
  );
}
```

#### 3. Form Components
```typescript
// Job application form
export function JobApplicationForm({ jobId }: { jobId: string }) {
  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      await submitApplication(jobId, data);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit application');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="coverLetter"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cover Letter</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Write your cover letter..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="resume"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume</FormLabel>
              <FormControl>
                <FileUpload {...field} accept=".pdf,.doc,.docx" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Submit Application
        </Button>
      </form>
    </Form>
  );
}
```

### State Management Patterns

#### 1. Authentication State
```typescript
// Auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
  };

  const signInWithLinkedIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'linkedin',
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      signInWithLinkedIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### 2. Job Data Management
```typescript
// Job data hook
export function useJobs(filters?: JobSearchFilters) {
  const { data, error, isLoading, mutate } = useSWR(
    filters ? ['jobs', filters] : 'jobs',
    () => fetchJobs(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    jobs: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}

// Application data hook
export function useApplications() {
  const { user } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    user ? ['applications', user.id] : null,
    () => fetchUserApplications(user!.id),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    applications: data || [],
    error,
    isLoading,
    refresh: mutate,
  };
}
```

### Performance Optimization

#### 1. Code Splitting
```typescript
// Lazy load admin components
const AdminPanel = lazy(() => import('@/components/admin/AdminPanel'));
const UserManagement = lazy(() => import('@/components/admin/UserManagement'));

// Route-based code splitting
export default function AdminPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminPanel />
    </Suspense>
  );
}
```

#### 2. Image Optimization
```typescript
// Next.js Image component for optimization
import Image from 'next/image';

export function CompanyLogo({ src, alt, size = 64 }: CompanyLogoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-lg object-cover"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  );
}
```

#### 3. Virtual Scrolling
```typescript
// Virtual scrolling for large job lists
import { FixedSizeList as List } from 'react-window';

export function VirtualizedJobList({ jobs }: { jobs: Job[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <JobCard job={jobs[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={jobs.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### Testing Strategy

#### 1. Unit Tests
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from '@/components/JobCard';

describe('JobCard', () => {
  const mockJob = {
    id: '1',
    title: 'Software Engineer',
    company: 'Tech Corp',
    location: 'San Francisco, CA',
  };

  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('calls onApply when apply button is clicked', () => {
    const onApply = jest.fn();
    render(<JobCard job={mockJob} onApply={onApply} />);
    
    fireEvent.click(screen.getByText('Apply Now'));
    expect(onApply).toHaveBeenCalledWith('1');
  });
});
```

#### 2. Integration Tests
```typescript
// Page-level testing
import { render, screen, waitFor } from '@testing-library/react';
import { JobSearchPage } from '@/app/jobs/page';

describe('JobSearchPage', () => {
  it('displays job search results', async () => {
    render(<JobSearchPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Search Jobs')).toBeInTheDocument();
    });
  });
});
```

#### 3. E2E Tests
```typescript
// End-to-end testing with Playwright
import { test, expect } from '@playwright/test';

test('job application flow', async ({ page }) => {
  await page.goto('/jobs');
  
  // Search for jobs
  await page.fill('[data-testid="search-input"]', 'software engineer');
  await page.click('[data-testid="search-button"]');
  
  // Wait for results
  await page.waitForSelector('[data-testid="job-card"]');
  
  // Click on first job
  await page.click('[data-testid="job-card"]:first-child');
  
  // Apply for job
  await page.click('[data-testid="apply-button"]');
  
  // Fill application form
  await page.fill('[data-testid="cover-letter"]', 'I am interested in this position...');
  
  // Submit application
  await page.click('[data-testid="submit-application"]');
  
  // Verify success message
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### Accessibility Requirements

#### 1. WCAG 2.1 AA Compliance
```typescript
// Accessible form components
export function AccessibleFormField({ label, error, children }: FormFieldProps) {
  const fieldId = useId();
  const errorId = useId();

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <div
        id={fieldId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={!!error}
      >
        {children}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// Keyboard navigation support
export function KeyboardNavigableList({ items, onSelect }: ListProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        onSelect(items[focusedIndex]);
        break;
    }
  };

  return (
    <div
      role="listbox"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none"
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          role="option"
          aria-selected={index === focusedIndex}
          className={`p-2 cursor-pointer ${
            index === focusedIndex ? 'bg-blue-100' : ''
          }`}
          onClick={() => onSelect(item)}
        >
          {item.title}
        </div>
      ))}
    </div>
  );
}
```

#### 2. Screen Reader Support
```typescript
// Screen reader announcements
export function useScreenReaderAnnouncement() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string) => {
    setAnnouncement(message);
    // Clear announcement after screen reader has time to read it
    setTimeout(() => setAnnouncement(''), 1000);
  };

  return {
    announcement,
    announce,
  };
}

// Live region for dynamic content
export function LiveRegion() {
  const { announcement } = useScreenReaderAnnouncement();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
```

### Error Handling & Loading States

#### 1. Error Boundaries
```typescript
// Error boundary component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but something unexpected happened.
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### 2. Loading States
```typescript
// Skeleton loading components
export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

// Loading wrapper hook
export function useLoadingState<T>(
  asyncFunction: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await asyncFunction();
        
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, loading, error };
}
```

### Deployment & Build Optimization

#### 1. Next.js Configuration
```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    domains: ['lh3.googleusercontent.com', 'via.placeholder.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      };
    }
    return config;
  },
};

export default nextConfig;
```

#### 2. Bundle Analysis
```typescript
// Bundle analyzer script
import { analyze } from '@next/bundle-analyzer';

const withBundleAnalyzer = analyze({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

### Performance Monitoring

#### 1. Web Vitals Tracking
```typescript
// Web vitals monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to analytics service
  console.log(metric);
}

export function reportWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}
```

#### 2. Performance Monitoring
```typescript
// Performance monitoring hook
export function usePerformanceMonitoring() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);
}
```

### Conclusion

The Frontend Agent specification provides a comprehensive guide for developing the Job Candidate Portal's user interface. By following these patterns and best practices, the frontend will deliver an excellent user experience while maintaining high performance, accessibility, and maintainability standards.

Key success factors:
- **User Experience**: Intuitive, responsive design that works across all devices
- **Performance**: Fast loading times and smooth interactions
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Maintainability**: Clean, well-documented code with comprehensive testing
- **Scalability**: Architecture that can grow with the application's needs
