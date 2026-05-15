import { describe, it, expect, vi, beforeEach } from "vitest";
import nodemailer from "nodemailer";
import { emailService } from "@/lib/services/email";

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn(),
      verify: vi.fn(),
    }),
  },
}));

describe("EmailService", () => {
  let mockTransporter: any;

  beforeEach(() => {
    // nodemailer.createTransport is called during module import (singleton)
    // We don't clear all mocks if we need the singleton's transporter
    vi.clearAllMocks();
    mockTransporter = (nodemailer.createTransport as any).mock.results[0]?.value || (nodemailer.createTransport as any)();
  });

  it("sendEmail sends mail with correct options", async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: "123" });

    const message = {
      to: { email: "user@example.com", name: "User" },
      subject: "Test Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    };

    const result = await emailService.sendEmail(message);

    expect(result).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: '"User" <user@example.com>',
      subject: "Test Subject",
    }));
  });

  it("sendApplicationStatusUpdate uses correct template", async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: "123" });

    const data = {
      candidateName: "John",
      jobTitle: "Developer",
      company: "Acme",
      newStatus: "interviewing",
      applicationUrl: "http://example.com",
    };

    const result = await emailService.sendApplicationStatusUpdate("john@example.com", data);

    expect(result).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      subject: expect.stringContaining("Application Update"),
    }));
  });

  it("verifyConnection returns true on success", async () => {
    mockTransporter.verify.mockResolvedValue(true);
    const result = await emailService.verifyConnection();
    expect(result).toBe(true);
  });

  it("handles sendMail failure", async () => {
    mockTransporter.sendMail.mockRejectedValue(new Error("SMTP Error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await emailService.sendEmail({
      to: { email: "test@example.com" },
      subject: "Test",
    });

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("sendWelcomeEmail uses correct template", async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: "123" });
    const result = await emailService.sendWelcomeEmail("user@example.com", {
      name: "John",
      email: "user@example.com",
      profileUrl: "http://test.com",
    });
    expect(result).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      subject: expect.stringContaining("Welcome"),
    }));
  });

  it("sendJobAlert uses correct template", async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: "123" });
    const result = await emailService.sendJobAlert("user@example.com", {
      candidateName: "John",
      jobs: [
        {
          id: "1",
          title: "Dev",
          company: "Company",
          location: "Remote",
          jobType: "Full Time",
          salary: "$100k",
          postedDate: "2023-01-01",
        },
        {
          id: "2",
          title: "Dev 2",
          company: "Company 2",
          location: "Remote",
          jobType: "Contract",
          postedDate: "2023-01-02",
        }
      ],
      unsubscribeUrl: "http://test.com/unsub",
    });
    expect(result).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      subject: expect.stringContaining("2 New Jobs Match Your Preferences"),
    }));
  });

  it("sendPasswordReset uses correct template", async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: "123" });
    const result = await emailService.sendPasswordReset("user@example.com", {
      name: "John",
      resetUrl: "http://test.com/reset",
      expiresIn: "1 hour",
    });
    expect(result).toBe(true);
    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      subject: expect.stringContaining("Reset Your Password"),
    }));
  });

  it("sendBulkEmails works correctly", async () => {
    mockTransporter.sendMail.mockResolvedValue({ messageId: "123" });
    const result = await emailService.sendBulkEmails([
      {
        to: "user@example.com",
        template: "job_alert",
        data: { candidateName: "A", jobs: [], unsubscribeUrl: "link" }
      },
      {
        to: "user2@example.com",
        template: "newsletter",
        data: {}
      }
    ], 0);

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
  });

  it("sendBulkEmails handles failures", async () => {
    mockTransporter.sendMail.mockRejectedValueOnce(new Error("Fail")).mockResolvedValueOnce({ messageId: "123" });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await emailService.sendBulkEmails([
      {
        to: "user@example.com",
        template: "job_alert",
        data: { candidateName: "A", jobs: [], unsubscribeUrl: "link" }
      },
      {
        to: "user2@example.com",
        template: "newsletter",
        data: {}
      }
    ], 0);

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    consoleSpy.mockRestore();
  });
});
