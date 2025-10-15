-- Sample Data Seed for Job Candidate Portal
-- Project ID: luniiecxbsyajdfjtsox
-- This file provides sample data for testing and development

-- ============================================================================
-- SAMPLE JOB CATEGORIES
-- ============================================================================

INSERT INTO public.job_categories (name, slug, description, icon, is_active) VALUES
('Software Engineering', 'software-engineering', 'Development, programming, and software architecture roles', 'code', true),
('Data Science', 'data-science', 'Data analysis, machine learning, and AI roles', 'chart-bar', true),
('Product Management', 'product-management', 'Product strategy, roadmap, and lifecycle management', 'product-hunt', true),
('Design', 'design', 'UI/UX design, graphic design, and product design', 'palette', true),
('Marketing', 'marketing', 'Digital marketing, content marketing, and growth', 'megaphone', true),
('Sales', 'sales', 'Business development, account management, and sales', 'trending-up', true),
('Human Resources', 'human-resources', 'Talent acquisition, HR operations, and people management', 'users', true),
('Operations', 'operations', 'Business operations, project management, and process improvement', 'settings', true),
('Finance', 'finance', 'Financial planning, accounting, and analysis', 'dollar-sign', true),
('Customer Support', 'customer-support', 'Customer service, technical support, and success', 'help-circle', true);

-- ============================================================================
-- SAMPLE COMPANIES
-- ============================================================================

INSERT INTO public.companies (name, slug, description, website, industry, size, location, founded_year, is_verified) VALUES
('TechCorp Solutions', 'techcorp-solutions', 'Leading software development company specializing in enterprise solutions and cloud technologies.', 'https://techcorp.example.com', 'Software', '201-500', 'San Francisco, CA', 2015, true),
('InnovateLab Inc', 'innovatelab-inc', 'Cutting-edge AI and machine learning company focused on transforming industries through intelligent automation.', 'https://innovatelab.example.com', 'Artificial Intelligence', '51-200', 'New York, NY', 2018, true),
('DataFlow Analytics', 'dataflow-analytics', 'Big data analytics platform helping businesses make data-driven decisions with advanced visualization tools.', 'https://dataflow.example.com', 'Data Analytics', '11-50', 'Austin, TX', 2020, true),
('CloudNine Systems', 'cloudnine-systems', 'Cloud infrastructure and DevOps solutions provider for scalable and secure enterprise applications.', 'https://cloudnine.example.com', 'Cloud Computing', '101-200', 'Seattle, WA', 2017, true),
('MobileFirst Design', 'mobilefirst-design', 'Mobile app development and UX design studio creating award-winning applications for iOS and Android.', 'https://mobilefirst.example.com', 'Mobile Development', '11-50', 'Los Angeles, CA', 2019, true),
('GreenTech Ventures', 'greentech-ventures', 'Sustainable technology company developing renewable energy solutions and environmental monitoring systems.', 'https://greentech.example.com', 'Clean Technology', '51-200', 'Portland, OR', 2016, true),
('FinanceHub Pro', 'financehub-pro', 'Fintech platform providing digital banking solutions and financial management tools for businesses.', 'https://financehub.example.com', 'Financial Services', '101-200', 'Chicago, IL', 2014, true),
('HealthTech Innovations', 'healthtech-innovations', 'Healthcare technology company developing telemedicine platforms and digital health solutions.', 'https://healthtech.example.com', 'Healthcare Technology', '51-200', 'Boston, MA', 2021, true);

-- ============================================================================
-- SAMPLE JOBS
-- ============================================================================

INSERT INTO public.jobs (frappe_job_id, company_id, title, slug, location, department, experience_level, job_type, employment_type, salary_range, description, requirements, benefits, responsibilities, tags, status, is_featured, is_remote, posted_at, expires_at) VALUES
-- TechCorp Solutions Jobs
('JOB-001', (SELECT id FROM public.companies WHERE slug = 'techcorp-solutions'), 'Senior Full Stack Developer', 'senior-full-stack-developer', 'San Francisco, CA', 'Engineering', 'Senior', 'Full-time', 'Permanent', '{"min": 120000, "max": 150000, "currency": "USD"}', 'We are looking for a Senior Full Stack Developer to join our dynamic engineering team. You will be responsible for developing scalable web applications using modern technologies and best practices.', 'Bachelor''s degree in Computer Science or related field. 5+ years of experience in full-stack development. Proficiency in React, Node.js, and PostgreSQL. Experience with cloud platforms (AWS/GCP). Strong problem-solving skills and attention to detail.', 'Competitive salary, health insurance, dental and vision coverage, 401k matching, flexible PTO, remote work options, professional development budget, stock options.', 'Design and develop scalable web applications. Collaborate with cross-functional teams. Write clean, maintainable code. Participate in code reviews. Mentor junior developers. Contribute to technical architecture decisions.', ARRAY['React', 'Node.js', 'PostgreSQL', 'AWS', 'JavaScript', 'TypeScript', 'Docker'], 'active', true, true, NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days'),

('JOB-002', (SELECT id FROM public.companies WHERE slug = 'techcorp-solutions'), 'DevOps Engineer', 'devops-engineer', 'San Francisco, CA', 'Engineering', 'Mid-level', 'Full-time', 'Permanent', '{"min": 90000, "max": 120000, "currency": "USD"}', 'Join our DevOps team to build and maintain our cloud infrastructure. You will work on automation, deployment pipelines, and ensuring high availability of our services.', '3+ years of experience in DevOps or Site Reliability Engineering. Strong knowledge of Kubernetes, Docker, and CI/CD pipelines. Experience with Infrastructure as Code (Terraform). AWS or GCP certification preferred.', 'Competitive salary, comprehensive health benefits, flexible working hours, professional certifications support, conference attendance opportunities.', 'Design and implement CI/CD pipelines. Manage cloud infrastructure using IaC. Monitor system performance and reliability. Automate deployment processes. Collaborate with development teams on best practices.', ARRAY['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD', 'Python', 'Linux'], 'active', false, true, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days'),

-- InnovateLab Inc Jobs
('JOB-003', (SELECT id FROM public.companies WHERE slug = 'innovatelab-inc'), 'Machine Learning Engineer', 'machine-learning-engineer', 'New York, NY', 'Data Science', 'Mid-level', 'Full-time', 'Permanent', '{"min": 110000, "max": 140000, "currency": "USD"}', 'We are seeking a talented Machine Learning Engineer to develop and deploy ML models that power our AI-driven products. You will work with large datasets and cutting-edge algorithms.', 'Master''s degree in Computer Science, Statistics, or related field. 3+ years of experience in machine learning. Proficiency in Python, TensorFlow/PyTorch. Experience with MLOps and model deployment. Strong statistical background.', 'Competitive salary, equity package, comprehensive health benefits, unlimited PTO, learning and development budget, free meals, gym membership.', 'Develop and train machine learning models. Design data pipelines and feature engineering processes. Deploy models to production environments. Monitor model performance and retrain as needed. Collaborate with data scientists and engineers.', ARRAY['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'SQL', 'AWS', 'Docker', 'Kubernetes'], 'active', true, false, NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days'),

('JOB-004', (SELECT id FROM public.companies WHERE slug = 'innovatelab-inc'), 'Data Scientist', 'data-scientist', 'New York, NY', 'Data Science', 'Mid-level', 'Full-time', 'Permanent', '{"min": 100000, "max": 130000, "currency": "USD"}', 'Join our data science team to analyze complex datasets and derive actionable insights. You will work on predictive modeling and statistical analysis to drive business decisions.', 'PhD or Master''s in Statistics, Mathematics, or related field. 3+ years of data science experience. Strong skills in R/Python, SQL, and statistical modeling. Experience with data visualization tools. Business acumen and communication skills.', 'Competitive salary, stock options, health and wellness benefits, flexible schedule, professional development opportunities, research publication support.', 'Analyze large datasets to identify trends and patterns. Build predictive models and statistical analyses. Create data visualizations and reports. Collaborate with product and engineering teams. Present findings to stakeholders.', ARRAY['Python', 'R', 'SQL', 'Pandas', 'Scikit-learn', 'Tableau', 'Statistics', 'A/B Testing'], 'active', false, true, NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days'),

-- DataFlow Analytics Jobs
('JOB-005', (SELECT id FROM public.companies WHERE slug = 'dataflow-analytics'), 'Frontend Developer', 'frontend-developer', 'Austin, TX', 'Engineering', 'Junior', 'Full-time', 'Permanent', '{"min": 70000, "max": 90000, "currency": "USD"}', 'We are looking for a passionate Frontend Developer to create beautiful and intuitive user interfaces for our data visualization platform.', 'Bachelor''s degree in Computer Science or equivalent experience. 2+ years of frontend development experience. Proficiency in React, JavaScript, and CSS. Experience with data visualization libraries (D3.js, Chart.js). Understanding of responsive design principles.', 'Competitive salary, health benefits, dental and vision coverage, 401k, flexible PTO, professional development budget, casual work environment.', 'Develop responsive web applications using React. Create interactive data visualizations. Collaborate with UX designers and backend developers. Write clean, maintainable code. Optimize applications for performance and accessibility.', ARRAY['React', 'JavaScript', 'CSS', 'D3.js', 'HTML', 'Responsive Design', 'Git'], 'active', false, true, NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days'),

-- CloudNine Systems Jobs
('JOB-006', (SELECT id FROM public.companies WHERE slug = 'cloudnine-systems'), 'Cloud Solutions Architect', 'cloud-solutions-architect', 'Seattle, WA', 'Engineering', 'Senior', 'Full-time', 'Permanent', '{"min": 140000, "max": 170000, "currency": "USD"}', 'Lead the design and implementation of cloud architecture solutions for our enterprise clients. You will work on complex, large-scale cloud migrations and infrastructure optimization.', 'Bachelor''s degree in Computer Science or related field. 7+ years of cloud architecture experience. AWS/Azure/GCP certifications required. Experience with microservices architecture. Strong communication and leadership skills.', 'Excellent compensation package, equity participation, comprehensive benefits, flexible work arrangements, conference attendance, certification reimbursement, sabbatical program.', 'Design cloud architecture solutions for enterprise clients. Lead cloud migration projects. Develop best practices and standards. Mentor technical teams. Interface with clients and stakeholders. Evaluate and recommend new technologies.', ARRAY['AWS', 'Azure', 'GCP', 'Kubernetes', 'Microservices', 'Terraform', 'Architecture Design'], 'active', true, false, NOW() - INTERVAL '6 days', NOW() + INTERVAL '24 days'),

-- MobileFirst Design Jobs
('JOB-007', (SELECT id FROM public.companies WHERE slug = 'mobilefirst-design'), 'Mobile App Developer (iOS)', 'mobile-app-developer-ios', 'Los Angeles, CA', 'Engineering', 'Mid-level', 'Full-time', 'Permanent', '{"min": 95000, "max": 125000, "currency": "USD"}', 'Join our mobile development team to create exceptional iOS applications. You will work on consumer-facing apps with millions of users.', '4+ years of iOS development experience. Proficiency in Swift and Objective-C. Experience with iOS frameworks and APIs. App Store deployment experience. Knowledge of mobile UI/UX principles. Experience with agile development methodologies.', 'Competitive salary, health benefits, equipment allowance, professional development support, flexible schedule, team building events, creative workspace.', 'Develop native iOS applications using Swift. Collaborate with designers and product managers. Implement new features and maintain existing codebase. Optimize app performance and user experience. Participate in code reviews and technical discussions.', ARRAY['iOS', 'Swift', 'Objective-C', 'Xcode', 'UIKit', 'Core Data', 'REST APIs'], 'active', false, false, NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days'),

-- GreenTech Ventures Jobs
('JOB-008', (SELECT id FROM public.companies WHERE slug = 'greentech-ventures'), 'IoT Software Developer', 'iot-software-developer', 'Portland, OR', 'Engineering', 'Mid-level', 'Full-time', 'Permanent', '{"min": 85000, "max": 110000, "currency": "USD"}', 'Develop software solutions for our IoT devices in the renewable energy sector. You will work on embedded systems and sensor data processing.', 'Bachelor''s degree in Computer Science or Electrical Engineering. 3+ years of embedded systems development. Experience with C/C++, Python, and IoT protocols. Knowledge of sensor technologies and data acquisition systems.', 'Competitive salary, comprehensive benefits, environmental impact bonus, flexible work arrangements, professional development opportunities, green commuting incentives.', 'Develop embedded software for IoT devices. Design and implement sensor data processing algorithms. Create device communication protocols. Work with hardware engineering teams. Optimize software for resource-constrained environments.', ARRAY['C/C++', 'Python', 'IoT', 'Embedded Systems', 'MQTT', 'Linux', 'Sensors'], 'active', false, true, NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days'),

-- FinanceHub Pro Jobs
('JOB-009', (SELECT id FROM public.companies WHERE slug = 'financehub-pro'), 'Backend Developer', 'backend-developer', 'Chicago, IL', 'Engineering', 'Mid-level', 'Full-time', 'Permanent', '{"min": 100000, "max": 125000, "currency": "USD"}', 'Build robust and secure backend systems for our fintech platform. You will work on high-performance APIs and financial data processing systems.', 'Bachelor''s degree in Computer Science. 4+ years of backend development experience. Proficiency in Java/Python and SQL. Experience with microservices architecture. Knowledge of financial regulations and security best practices.', 'Competitive salary, performance bonuses, comprehensive health benefits, 401k with matching, flexible PTO, professional certification support, financial wellness programs.', 'Design and develop scalable backend APIs. Implement secure financial data processing systems. Work with database optimization and performance tuning. Collaborate with frontend and mobile teams. Ensure compliance with financial regulations.', ARRAY['Java', 'Python', 'Spring Boot', 'PostgreSQL', 'REST APIs', 'Microservices', 'Security'], 'active', false, true, NOW() - INTERVAL '9 days', NOW() + INTERVAL '21 days'),

-- HealthTech Innovations Jobs
('JOB-010', (SELECT id FROM public.companies WHERE slug = 'healthtech-innovations'), 'Product Manager', 'product-manager', 'Boston, MA', 'Product', 'Senior', 'Full-time', 'Permanent', '{"min": 130000, "max": 160000, "currency": "USD"}', 'Lead product strategy and development for our telemedicine platform. You will work closely with engineering, design, and clinical teams to deliver innovative healthcare solutions.', 'MBA or equivalent experience. 5+ years of product management experience, preferably in healthcare or SaaS. Strong analytical and communication skills. Experience with agile methodologies. Understanding of healthcare regulations (HIPAA, FDA).', 'Excellent compensation, equity package, comprehensive health benefits, unlimited PTO, professional development budget, healthcare industry conferences, wellness programs.', 'Define product strategy and roadmap. Conduct market research and competitive analysis. Work with cross-functional teams to deliver features. Analyze product metrics and user feedback. Ensure compliance with healthcare regulations. Present to executive team and board.', ARRAY['Product Management', 'Healthcare', 'SaaS', 'Analytics', 'Agile', 'HIPAA', 'Strategy'], 'active', true, true, NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days');

-- ============================================================================
-- MAP JOBS TO CATEGORIES
-- ============================================================================

-- Software Engineering jobs
INSERT INTO public.job_category_mappings (job_id, category_id) VALUES
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-001'), (SELECT id FROM public.job_categories WHERE slug = 'software-engineering')),
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-002'), (SELECT id FROM public.job_categories WHERE slug = 'software-engineering')),
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-005'), (SELECT id FROM public.job_categories WHERE slug = 'software-engineering')),
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-006'), (SELECT id FROM public.job_categories WHERE slug = 'software-engineering')),
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-007'), (SELECT id FROM public.job_categories WHERE slug = 'software-engineering')),
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-008'), (SELECT id FROM public.job_categories WHERE slug = 'software-engineering')),
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-009'), (SELECT id FROM public.job_categories WHERE slug = 'software-engineering'));

-- Data Science jobs
INSERT INTO public.job_category_mappings (job_id, category_id) VALUES
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-003'), (SELECT id FROM public.job_categories WHERE slug = 'data-science')),
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-004'), (SELECT id FROM public.job_categories WHERE slug = 'data-science'));

-- Product Management jobs
INSERT INTO public.job_category_mappings (job_id, category_id) VALUES
((SELECT id FROM public.jobs WHERE frappe_job_id = 'JOB-010'), (SELECT id FROM public.job_categories WHERE slug = 'product-management'));

-- ============================================================================
-- SAMPLE SYSTEM SETTINGS
-- ============================================================================

INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('site_name', '"Job Portal"', 'The name of the job portal site', true),
('site_description', '"Find your dream job with our comprehensive job portal"', 'Site description for SEO', true),
('max_applications_per_day', '5', 'Maximum number of applications a user can submit per day', false),
('featured_jobs_limit', '10', 'Number of featured jobs to display on homepage', true),
('job_expiry_days', '30', 'Default number of days before a job posting expires', false),
('email_notifications_enabled', 'true', 'Whether email notifications are enabled', false),
('maintenance_mode', 'false', 'Whether the site is in maintenance mode', false),
('supported_file_types', '["pdf", "doc", "docx"]', 'Supported file types for document uploads', true),
('max_file_size_mb', '10', 'Maximum file size in MB for uploads', true),
('company_verification_required', 'true', 'Whether companies need to be verified to post jobs', false);

-- ============================================================================
-- SAMPLE ADMIN USER (Note: This would typically be created through Supabase Auth)
-- ============================================================================

-- Insert a sample admin user profile (assuming auth.users entry exists)
-- This is just for reference - actual user creation should be done through Supabase Auth

-- Example of what the admin user data might look like:
/*
-- This would be created via Supabase Auth, then the trigger would create the profile
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@candidateportal.com',
  crypt('admin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- The trigger would automatically create this, but for reference:
INSERT INTO public.users (id, email, first_name, last_name, role, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@candidateportal.com', 'Admin', 'User', 'super_admin', true);
*/

-- ============================================================================
-- SAMPLE NOTIFICATIONS TEMPLATES
-- ============================================================================

-- These would typically be created by the application, but here for reference
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('notification_templates', '{
  "application_submitted": {
    "title": "Application Submitted Successfully",
    "message": "Your application for {{job_title}} at {{company_name}} has been submitted successfully."
  },
  "application_status_update": {
    "title": "Application Status Updated",
    "message": "Your application status for {{job_title}} has been updated to {{status}}."
  },
  "interview_scheduled": {
    "title": "Interview Scheduled",
    "message": "An interview has been scheduled for {{job_title}} on {{date}} at {{time}}."
  },
  "job_recommendation": {
    "title": "New Job Recommendation",
    "message": "We found a job that matches your profile: {{job_title}} at {{company_name}}."
  }
}', 'Email and notification templates', false);

-- ============================================================================
-- INDEXES FOR BETTER PERFORMANCE ON SAMPLE DATA
-- ============================================================================

-- These indexes should already be created by the migrations, but ensuring they exist
-- for optimal performance with the sample data

-- Ensure GIN indexes are properly created for JSONB columns
REINDEX INDEX CONCURRENTLY IF EXISTS idx_jobs_salary_range;
REINDEX INDEX CONCURRENTLY IF EXISTS idx_jobs_tags;
REINDEX INDEX CONCURRENTLY IF EXISTS idx_system_settings_value;

-- ============================================================================
-- SAMPLE DATA VALIDATION
-- ============================================================================

-- Function to validate the sample data was inserted correctly
CREATE OR REPLACE FUNCTION public.validate_sample_data()
RETURNS TABLE(
  table_name TEXT,
  record_count BIGINT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'job_categories'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'INSUFFICIENT' END::TEXT
  FROM public.job_categories

  UNION ALL

  SELECT 'companies'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 8 THEN 'OK' ELSE 'INSUFFICIENT' END::TEXT
  FROM public.companies

  UNION ALL

  SELECT 'jobs'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'INSUFFICIENT' END::TEXT
  FROM public.jobs

  UNION ALL

  SELECT 'job_category_mappings'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'INSUFFICIENT' END::TEXT
  FROM public.job_category_mappings

  UNION ALL

  SELECT 'system_settings'::TEXT, COUNT(*)::BIGINT,
    CASE WHEN COUNT(*) >= 10 THEN 'OK' ELSE 'INSUFFICIENT' END::TEXT
  FROM public.system_settings;
END;
$$ LANGUAGE plpgsql;

-- Run validation
-- SELECT * FROM public.validate_sample_data();