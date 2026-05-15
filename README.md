# Job Candidate Portal

A comprehensive web application for job seekers to discover, apply for, and track employment opportunities. Built with Next.js 15 and React 19, integrating with Frappe ERPNext for job management and Supabase for authentication and user data.

## Features

### For Job Seekers
- **Job Discovery**: Advanced search and filtering by location, department, experience level, and tags
- **Application Management**: One-click applications with real-time status tracking
- **Profile Management**: Upload resumes, cover letters, and portfolios
- **Application Tracking**: Monitor application status through the complete hiring pipeline
- **Social Sharing**: Share job opportunities via social media and direct links

### For Administrators
- **Super Admin Onboarding**: First-time setup wizard for system configuration
- **User Management**: Role assignment and permissions control
- **Frappe Integration**: API client setup and brand logo configuration
- **OAuth Configuration**: Google and LinkedIn authentication setup
- **Analytics Dashboard**: Application metrics and system health monitoring

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4 with Shadcn/ui components
- **Authentication**: Supabase Auth with Google/LinkedIn OAuth
- **Backend**: Dual structure with Supabase and Frappe ERPNext
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage for documents

## Architecture

The application uses a dual-structure backend:

- **Supabase**: Handles user authentication, profiles, applications, and real-time features
- **Frappe ERPNext**: Manages job postings, company data, and HR workflows

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Frappe ERPNext instance (for job data)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd candidate-portal
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

4. Start the development server:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
├── app/                    # Next.js app router pages
├── components/             # Reusable UI components
├── lib/                   # Utility functions and configurations
├── types/                 # TypeScript type definitions
├── supabase/              # Database schema and migrations
├── public/                # Static assets
└── docs/                  # Documentation files
```

## Available Scripts

- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Documentation

- [Product Requirements Document](./PRD.md) - Detailed product specifications
- [API Documentation](./API_DOCUMENTATION.md) - API endpoints and integration details
- [OAuth Implementation](./docs/oauth-implementation.md) - Authentication setup guide

## User Roles

- **Super Admin**: System configuration and setup
- **Admin**: User management and application review
- **Candidate**: Job search and application management

## Deployment

The application can be deployed on:
- [Vercel](https://vercel.com) (recommended for Next.js)
- [Netlify](https://netlify.com)
- Any Node.js hosting platform
- Docker-compatible platforms using the included `Dockerfile`

Make sure to configure environment variables in your deployment platform.

For container deployment, see [Docker Deployment](./docs/docker-deployment.md).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is private and proprietary.
