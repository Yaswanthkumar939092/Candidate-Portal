# Product Requirements Document (PRD)
## Job Candidate Portal

### 1. Executive Summary

The Job Candidate Portal is a comprehensive web application designed for job seekers to discover, apply for, and track employment opportunities. The system integrates with Frappe ERPNext for job data management and Supabase for authentication and user management, creating a dual-structure backend architecture.

### 2. Product Overview

**Product Name:** Job Candidate Portal  
**Target Users:** Job seekers, HR administrators, Super admins  
**Platform:** Web application (Next.js 15, React 19)  
**Architecture:** Frontend (Next.js) + Backend (Supabase + Frappe ERPNext)

### 3. Core Features

#### 3.1 Job Discovery & Search
- **Job Listing Page**: Display jobs with filtering capabilities
- **Advanced Search**: Filter by location, department, experience, country, tags
- **Job Cards**: Show company logo, title, location, experience, department
- **Job Details**: Comprehensive job description with breadcrumb navigation
- **Save Jobs**: Bookmark jobs for later viewing
- **Social Sharing**: Share job opportunities via social media and direct links

#### 3.2 Application Management
- **Apply Now**: One-click application process
- **Application Tracking**: Real-time status updates (Applied, In Review, Interview, Offer, Rejected, Withdrawn)
- **Application History**: Complete application timeline
- **Document Management**: Upload resumes, cover letters, portfolios
- **Calendar Integration**: Schedule and track interviews

#### 3.3 User Profile & Settings
- **Profile Management**: Personal information, contact details
- **Document Storage**: Resume, cover letter, portfolio management
- **Account Settings**: Email, phone, password management
- **Privacy Controls**: Data usage, cookies, location settings
- **Notification Preferences**: Email and push notifications

#### 3.4 Admin Panel & Onboarding
- **Super Admin Onboarding**: First-time setup wizard
- **Frappe Configuration**: API client setup, brand logo configuration
- **OAuth Setup**: Google and LinkedIn authentication configuration
- **User Management**: Role assignment and permissions
- **Statistics Dashboard**: Application metrics and system health
- **Settings Management**: System configuration and updates

### 4. Technical Architecture

#### 4.1 Frontend Stack
- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 with custom design system
- **Components**: Shadcn/ui components
- **State Management**: React hooks and context
- **Authentication**: Supabase Auth with Google/LinkedIn OAuth

#### 4.2 Backend Architecture (Dual Structure)

**Supabase (Primary)**
- User authentication and authorization
- User profile management
- Application tracking
- Document storage
- Real-time notifications
- Role-based access control

**Frappe ERPNext (Secondary)**
- Job posting management
- Company information
- Job descriptions and requirements
- Employee data (post-offer acceptance)
- Brand assets and logos
- HR workflow management

#### 4.3 Data Flow
1. **Job Data**: Frappe ERPNext → Supabase (sync) → Frontend
2. **User Data**: Supabase → Frontend
3. **Applications**: Frontend → Supabase → Frappe ERPNext (on offer acceptance)
4. **Authentication**: Supabase Auth → Frontend

### 5. User Roles & Permissions

#### 5.1 Super Admin
- System configuration and setup
- Frappe ERPNext integration management
- OAuth provider configuration
- User role assignment
- System statistics and monitoring
- Onboarding wizard management

#### 5.2 Admin
- User management and role assignment
- Application review and status updates
- System settings configuration
- Basic statistics access

#### 5.3 Candidate
- Job search and application
- Profile management
- Document upload and management
- Application tracking
- Calendar and interview management

### 6. Key Screens & User Flows

#### 6.1 Candidate Journey
1. **Landing/Home**: Job recommendations and search
2. **Job Search**: Filtered job listings
3. **Job Details**: Complete job information with apply button
4. **Application**: One-click apply with document selection
5. **Profile**: Personal information and document management
6. **Applications**: Track application status
7. **Calendar**: Interview scheduling and management
8. **Settings**: Account and privacy preferences

#### 6.2 Admin Journey
1. **Onboarding**: First-time setup wizard
2. **Dashboard**: Statistics and system overview
3. **User Management**: Role assignment and permissions
4. **Settings**: System configuration
5. **Applications**: Review and manage applications

### 7. Integration Requirements

#### 7.1 Frappe ERPNext Integration
- **API Endpoints**: Job listings, company data, job details
- **Authentication**: API key-based authentication
- **Data Sync**: Real-time job data synchronization
- **Employee Creation**: Post-offer acceptance employee record creation
- **Brand Assets**: Company logos and branding elements

#### 7.2 OAuth Providers
- **Google OAuth**: User authentication and profile data
- **LinkedIn OAuth**: Professional profile integration
- **Configuration**: Admin-configurable OAuth settings

#### 7.3 Third-party Services
- **File Storage**: Document upload and management
- **Email Service**: Notification delivery
- **Calendar Integration**: Interview scheduling
- **Social Sharing**: Job opportunity sharing

### 8. Security & Compliance

#### 8.1 Authentication & Authorization
- Multi-factor authentication support
- Role-based access control (RBAC)
- Session management and security
- OAuth 2.0 compliance

#### 8.2 Data Protection
- GDPR compliance for user data
- Data encryption in transit and at rest
- Privacy controls and user consent
- Secure document storage

#### 8.3 API Security
- Rate limiting and DDoS protection
- API key management and rotation
- Input validation and sanitization
- CORS configuration

### 9. Performance Requirements

#### 9.1 Response Times
- Page load: < 2 seconds
- API responses: < 500ms
- Search results: < 1 second
- File uploads: Progress indication

#### 9.2 Scalability
- Support 10,000+ concurrent users
- Handle 100,000+ job listings
- 99.9% uptime requirement
- Auto-scaling capabilities

### 10. Mobile Responsiveness

#### 10.1 Design Principles
- Mobile-first responsive design
- Touch-friendly interface
- Optimized for various screen sizes
- Progressive Web App (PWA) capabilities

#### 10.2 Breakpoints
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

### 11. Analytics & Monitoring

#### 11.1 User Analytics
- Job search patterns
- Application conversion rates
- User engagement metrics
- Performance monitoring

#### 11.2 System Monitoring
- Application performance
- Error tracking and logging
- User feedback collection
- A/B testing capabilities

### 12. Deployment & DevOps

#### 12.1 Environment Setup
- Development environment
- Staging environment
- Production environment
- CI/CD pipeline

#### 12.2 Infrastructure
- Cloud hosting (Vercel/Netlify)
- Database hosting (Supabase)
- CDN for static assets
- Monitoring and logging

### 13. Success Metrics

#### 13.1 User Engagement
- Daily active users
- Job application completion rate
- User retention rate
- Time spent on platform

#### 13.2 Business Metrics
- Job posting views
- Application submissions
- Conversion rates
- User satisfaction scores

### 14. Future Enhancements

#### 14.1 Phase 2 Features
- Advanced job recommendations
- Company reviews and ratings
- Salary insights and comparisons
- Career development tools

#### 14.2 Phase 3 Features
- Video interview integration
- AI-powered job matching
- Skills assessment tools
- Networking features

### 15. Risk Assessment

#### 15.1 Technical Risks
- Frappe ERPNext API limitations
- Supabase scaling challenges
- Third-party service dependencies
- Data synchronization issues

#### 15.2 Mitigation Strategies
- Comprehensive API testing
- Fallback mechanisms
- Data backup and recovery
- Performance monitoring

### 16. Timeline & Milestones

#### 16.1 Phase 1 (MVP) - 8 weeks
- Basic job search and application
- User authentication and profiles
- Admin panel setup
- Frappe integration

#### 16.2 Phase 2 (Enhanced) - 4 weeks
- Advanced filtering and search
- Document management
- Application tracking
- Mobile optimization

#### 16.3 Phase 3 (Complete) - 4 weeks
- Admin onboarding wizard
- Analytics and reporting
- Performance optimization
- Testing and deployment

### 17. Conclusion

The Job Candidate Portal represents a comprehensive solution for modern job seeking, combining the power of Frappe ERPNext for job management with Supabase for user experience. The dual-structure backend ensures scalability while maintaining data integrity and security. The responsive design and intuitive user interface will provide an excellent experience for job seekers while giving administrators powerful tools for management and oversight.
