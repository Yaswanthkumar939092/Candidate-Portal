import nodemailer from 'nodemailer'
import { z } from 'zod'

// Email configuration schemas
const emailConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  secure: z.boolean(),
  auth: z.object({
    user: z.string(),
    pass: z.string(),
  }),
})

const emailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
})

const emailMessageSchema = z.object({
  to: z.union([emailRecipientSchema, z.array(emailRecipientSchema)]),
  cc: z.union([emailRecipientSchema, z.array(emailRecipientSchema)]).optional(),
  bcc: z.union([emailRecipientSchema, z.array(emailRecipientSchema)]).optional(),
  subject: z.string().min(1, 'Subject is required'),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    path: z.string().optional(),
    content: z.string().optional(),
    contentType: z.string().optional(),
  })).optional(),
  replyTo: emailRecipientSchema.optional(),
  priority: z.enum(['high', 'normal', 'low']).optional().default('normal'),
})

// Email templates
interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface ApplicationStatusEmailData {
  candidateName: string
  jobTitle: string
  company: string
  newStatus: string
  oldStatus?: string
  notes?: string
  rejectionReason?: string
  applicationUrl: string
}

interface WelcomeEmailData {
  name: string
  email: string
  profileUrl: string
}

interface JobAlertEmailData {
  candidateName: string
  jobs: Array<{
    id: string
    title: string
    company: string
    location: string
    jobType: string
    salary?: string
    postedDate: string
  }>
  unsubscribeUrl: string
}

interface PasswordResetEmailData {
  name: string
  resetUrl: string
  expiresIn: string
}

class EmailService {
  private transporter: nodemailer.Transporter
  private fromAddress: string
  private fromName: string

  constructor() {
    // Initialize email transporter
    const config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    }

    this.fromAddress = process.env.FROM_EMAIL || 'noreply@candidateportal.com'
    this.fromName = process.env.FROM_NAME || 'Candidate Portal'

    try {
      emailConfigSchema.parse(config)
      this.transporter = nodemailer.createTransport(config)
    } catch (error) {
      console.error('Invalid email configuration:', error)
      throw new Error('Email service configuration is invalid')
    }
  }

  /**
   * Send a generic email
   */
  async sendEmail(message: z.input<typeof emailMessageSchema>): Promise<boolean> {
    try {
      // Validate message
      const validatedMessage = emailMessageSchema.parse(message)

      // Format recipients
      const formatRecipients = (recipients: typeof validatedMessage.to) => {
        if (Array.isArray(recipients)) {
          return recipients.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join(', ')
        }
        return recipients.name ? `"${recipients.name}" <${recipients.email}>` : recipients.email
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: formatRecipients(validatedMessage.to),
        cc: validatedMessage.cc ? formatRecipients(validatedMessage.cc) : undefined,
        bcc: validatedMessage.bcc ? formatRecipients(validatedMessage.bcc) : undefined,
        replyTo: validatedMessage.replyTo ?
          (validatedMessage.replyTo.name ? `"${validatedMessage.replyTo.name}" <${validatedMessage.replyTo.email}>` : validatedMessage.replyTo.email) :
          undefined,
        subject: validatedMessage.subject,
        text: validatedMessage.text,
        html: validatedMessage.html,
        attachments: validatedMessage.attachments,
        priority: validatedMessage.priority,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      return true

    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  /**
   * Send application status update notification
   */
  async sendApplicationStatusUpdate(
    candidateEmail: string,
    data: ApplicationStatusEmailData
  ): Promise<boolean> {
    const template = this.getApplicationStatusTemplate(data)

    return await this.sendEmail({
      to: { email: candidateEmail, name: data.candidateName },
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: data.newStatus === 'offered' ? 'high' : 'normal',
    })
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, data: WelcomeEmailData): Promise<boolean> {
    const template = this.getWelcomeTemplate(data)

    return await this.sendEmail({
      to: { email, name: data.name },
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  /**
   * Send job alerts to candidates
   */
  async sendJobAlert(candidateEmail: string, data: JobAlertEmailData): Promise<boolean> {
    const template = this.getJobAlertTemplate(data)

    return await this.sendEmail({
      to: { email: candidateEmail, name: data.candidateName },
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, data: PasswordResetEmailData): Promise<boolean> {
    const template = this.getPasswordResetTemplate(data)

    return await this.sendEmail({
      to: { email, name: data.name },
      subject: template.subject,
      html: template.html,
      text: template.text,
      priority: 'high',
    })
  }

  /**
   * Send bulk emails with rate limiting
   */
  async sendBulkEmails(
    emails: Array<
      | { template: 'job_alert'; to: string; data: JobAlertEmailData }
      | { template: 'newsletter'; to: string; data: Record<string, unknown> }
    >,
    delayMs: number = 100
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const emailData of emails) {
      try {
        let success = false

        switch (emailData.template) {
          case 'job_alert':
            success = await this.sendJobAlert(emailData.to, emailData.data)
            break
          case 'newsletter':
            // Newsletter template would be implemented here
            success = true
            break
        }

        if (success) {
          sent++
        } else {
          failed++
        }

        // Rate limiting delay
        if (delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }

      } catch (error) {
        console.error(`Failed to send email to ${emailData.to}:`, error)
        failed++
      }
    }

    return { sent, failed }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      return true
    } catch (error) {
      console.error('Email service verification failed:', error)
      return false
    }
  }

  // Template generators
  private getApplicationStatusTemplate(data: ApplicationStatusEmailData): EmailTemplate {
    const statusMessages = {
      pending: 'Your application is being reviewed',
      reviewing: 'Your application is currently under review',
      interviewing: 'Congratulations! You have been selected for an interview',
      offered: 'Congratulations! You have received a job offer',
      rejected: 'Thank you for your interest, but we have decided to proceed with other candidates',
      withdrawn: 'Your application has been withdrawn',
    }

    const statusColors = {
      pending: '#f59e0b',
      reviewing: '#3b82f6',
      interviewing: '#8b5cf6',
      offered: '#10b981',
      rejected: '#ef4444',
      withdrawn: '#6b7280',
    }

    const subject = `Application Update: ${data.jobTitle} at ${data.company}`

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Candidate Portal</h1>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Application Status Update</h2>
              <p>Dear ${data.candidateName},</p>
              <p>Your application for <strong>${data.jobTitle}</strong> at <strong>${data.company}</strong> has been updated.</p>
            </div>

            <div style="background-color: ${statusColors[data.newStatus as keyof typeof statusColors]}; color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="margin: 0;">Status: ${data.newStatus.toUpperCase()}</h3>
              <p style="margin: 10px 0 0;">${statusMessages[data.newStatus as keyof typeof statusMessages]}</p>
            </div>

            ${data.notes ? `
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0;">Additional Notes:</h4>
                <p>${data.notes}</p>
              </div>
            ` : ''}

            ${data.rejectionReason ? `
              <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                <h4 style="margin-top: 0; color: #dc2626;">Feedback:</h4>
                <p>${data.rejectionReason}</p>
              </div>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.applicationUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Application
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>This is an automated message from Candidate Portal.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Application Status Update

      Dear ${data.candidateName},

      Your application for ${data.jobTitle} at ${data.company} has been updated.

      New Status: ${data.newStatus.toUpperCase()}
      ${statusMessages[data.newStatus as keyof typeof statusMessages]}

      ${data.notes ? `Notes: ${data.notes}` : ''}
      ${data.rejectionReason ? `Feedback: ${data.rejectionReason}` : ''}

      View your application: ${data.applicationUrl}

      ---
      This is an automated message from Candidate Portal.
    `

    return { subject, html, text }
  }

  private getWelcomeTemplate(data: WelcomeEmailData): EmailTemplate {
    const subject = 'Welcome to Candidate Portal!'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Welcome to Candidate Portal</h1>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hello ${data.name}!</h2>
              <p>Welcome to Candidate Portal! We're excited to have you join our community of job seekers.</p>

              <h3>What you can do now:</h3>
              <ul>
                <li>Complete your profile with skills and experience</li>
                <li>Upload your resume and other documents</li>
                <li>Browse and apply for jobs</li>
                <li>Track your applications</li>
                <li>Set up job alerts for positions that match your preferences</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.profileUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Complete Your Profile
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>Need help getting started? Contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Welcome to Candidate Portal!

      Hello ${data.name}!

      Welcome to Candidate Portal! We're excited to have you join our community of job seekers.

      What you can do now:
      - Complete your profile with skills and experience
      - Upload your resume and other documents
      - Browse and apply for jobs
      - Track your applications
      - Set up job alerts for positions that match your preferences

      Complete your profile: ${data.profileUrl}

      Need help getting started? Contact our support team.
    `

    return { subject, html, text }
  }

  private getJobAlertTemplate(data: JobAlertEmailData): EmailTemplate {
    const subject = `${data.jobs.length} New Job${data.jobs.length > 1 ? 's' : ''} Match Your Preferences`

    const jobsHtml = data.jobs.map(job => `
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0;">
        <h3 style="margin: 0 0 10px; color: #1f2937;">${job.title}</h3>
        <p style="margin: 5px 0; color: #6b7280;">${job.company} • ${job.location}</p>
        <p style="margin: 5px 0; color: #6b7280;">${job.jobType}${job.salary ? ` • ${job.salary}` : ''}</p>
        <p style="margin: 10px 0 0; font-size: 14px; color: #6b7280;">Posted: ${job.postedDate}</p>
      </div>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Job Alert</h1>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.candidateName}!</h2>
              <p>We found ${data.jobs.length} new job${data.jobs.length > 1 ? 's' : ''} that match your preferences:</p>
            </div>

            ${jobsHtml}

            <div style="text-align: center; margin: 30px 0;">
              <a href="/jobs"
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View All Jobs
              </a>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p><a href="${data.unsubscribeUrl}" style="color: #6b7280;">Unsubscribe from job alerts</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    const jobsText = data.jobs.map(job =>
      `${job.title}\n${job.company} • ${job.location}\n${job.jobType}${job.salary ? ` • ${job.salary}` : ''}\nPosted: ${job.postedDate}\n`
    ).join('\n')

    const text = `
      Job Alert

      Hi ${data.candidateName}!

      We found ${data.jobs.length} new job${data.jobs.length > 1 ? 's' : ''} that match your preferences:

      ${jobsText}

      View all jobs: /jobs

      Unsubscribe from job alerts: ${data.unsubscribeUrl}
    `

    return { subject, html, text }
  }

  private getPasswordResetTemplate(data: PasswordResetEmailData): EmailTemplate {
    const subject = 'Reset Your Password - Candidate Portal'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb;">Password Reset</h1>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px;">
              <h2 style="color: #1f2937; margin-top: 0;">Hi ${data.name}!</h2>
              <p>You requested a password reset for your Candidate Portal account.</p>
              <p>Click the button below to reset your password:</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.resetUrl}"
                 style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>

            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <p style="margin: 0;"><strong>Security Notice:</strong></p>
              <p style="margin: 5px 0;">This link will expire in ${data.expiresIn}.</p>
              <p style="margin: 5px 0 0;">If you didn't request this reset, please ignore this email.</p>
            </div>

            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
              <p>If the button doesn't work, copy this link:</p>
              <p style="word-break: break-all;">${data.resetUrl}</p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      Password Reset - Candidate Portal

      Hi ${data.name}!

      You requested a password reset for your Candidate Portal account.

      Reset your password: ${data.resetUrl}

      Security Notice:
      This link will expire in ${data.expiresIn}.
      If you didn't request this reset, please ignore this email.
    `

    return { subject, html, text }
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Export types for use in other modules
export type {
  ApplicationStatusEmailData,
  WelcomeEmailData,
  JobAlertEmailData,
  PasswordResetEmailData,
}