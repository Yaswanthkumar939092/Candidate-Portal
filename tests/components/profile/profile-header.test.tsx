import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProfileHeader } from "@/components/profile/profile-header"
import type { Profile } from "@/types/database"
import { toast } from "sonner"
import { useFileUpload } from "@/lib/hooks/useFileUpload"
import { useUpdateProfile } from "@/lib/hooks/useUpdateProfile"

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock("@/lib/hooks/useFileUpload", () => ({
  useFileUpload: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock("@/lib/hooks/useUpdateProfile", () => ({
  useUpdateProfile: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

// ─── Shared mock data ────────────────────────────────────────────────
const BASE_PROFILE: Profile = {
  id: "1",
  email: "test@example.com",
  full_name: "Alex Smith",
  avatar_url: null,
  phone: null,
  location: null,
  bio: null,
  skills: null,
  experience_level: null,
  preferred_salary_min: null,
  preferred_salary_max: null,
  preferred_job_types: null,
  role: "candidate",
  provider: "email",
  lifecycle_stage: "candidate",
  frappe_employee_id: null,
  is_internal_employee: false,
  email_domain: null,
  created_at: "2025-01-01T00:00:00.000Z",
  updated_at: "2025-06-01T00:00:00.000Z",
}

// =====================================================================
//  PROFILE HEADER – NAME & INITIALS
// =====================================================================
describe("ProfileHeader – Name & Initials", () => {
  it("renders the user's full name", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.getByText("Alex Smith")).toBeTruthy()
  })

  it("shows initials when avatar_url is empty", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.getByText("AS")).toBeTruthy()
  })

  it("shows '?' initials when full_name is null", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, full_name: null }} />)
    expect(screen.getByText("?")).toBeTruthy()
  })

  it("shows initials from single-word name", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, full_name: "Madonna" }} />)
    expect(screen.getByText("M")).toBeTruthy()
  })

  it("shows at most 2 characters as initials", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, full_name: "John Michael Doe" }} />)
    expect(screen.getByText("JM")).toBeTruthy()
  })
})

// =====================================================================
//  PROFILE HEADER – LIFECYCLE BADGE
// =====================================================================
describe("ProfileHeader – Lifecycle Badge", () => {
  it("shows 'Candidate' badge for candidate stage", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, lifecycle_stage: "candidate" }} />)
    expect(screen.getByText("Candidate")).toBeTruthy()
  })

  it("shows 'Onboarding' badge for onboarding stage", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, lifecycle_stage: "onboarding" }} />)
    expect(screen.getByText("Onboarding")).toBeTruthy()
  })

  it("shows 'Employee' badge for employee stage", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, lifecycle_stage: "employee" }} />)
    expect(screen.getByText("Employee")).toBeTruthy()
  })
})

// =====================================================================
//  PROFILE HEADER – CONTACT DETAILS
// =====================================================================
describe("ProfileHeader – Contact Details", () => {
  it("always renders the email pill", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.getByText("test@example.com")).toBeTruthy()
  })

  it("renders phone pill when phone is provided", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, phone: "+91-9876543210" }} />)
    expect(screen.getByText("+91-9876543210")).toBeTruthy()
  })

  it("does not render phone pill when phone is null", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.queryByText(/\+91/)).toBeNull()
  })

  it("renders location pill when location is provided", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, location: "Bengaluru, KA" }} />)
    expect(screen.getByText("Bengaluru, KA")).toBeTruthy()
  })

  it("does not render location pill when location is null", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.queryByText("Bengaluru, KA")).toBeNull()
  })
})

// =====================================================================
//  PROFILE HEADER – BIO
// =====================================================================
describe("ProfileHeader – Bio", () => {
  it("renders bio text when provided", () => {
    render(<ProfileHeader profile={{ ...BASE_PROFILE, bio: "Passionate developer." }} />)
    expect(screen.getByText("Passionate developer.")).toBeTruthy()
  })

  it("does not render bio section when bio is null", () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    expect(screen.queryByText("Passionate developer.")).toBeNull()
  })
})

// =====================================================================
//  PROFILE HEADER – EDITING & AVATAR UPLOAD
// =====================================================================
describe("ProfileHeader – Editing & Avatar Upload", () => {
  let mockUpdateMutateAsync: any;
  let mockUploadMutate: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMutateAsync = vi.fn().mockResolvedValue({});
    (useUpdateProfile as any).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    });

    mockUploadMutate = vi.fn((file, options) => {
      // default mock calls onSuccess
      options.onSuccess({ file_url: "/files/avatar.png" });
    });
    (useFileUpload as any).mockReturnValue({
      mutate: mockUploadMutate,
      isPending: false,
    });
    
    // Stub URL.createObjectURL since it's not in JSDOM
    URL.createObjectURL = vi.fn().mockReturnValue("blob:fake-url");
  });

  it("toggles edit mode and saves name successfully", async () => {
    render(<ProfileHeader profile={BASE_PROFILE} />)
    
    // Click name to edit
    const nameHeading = screen.getByText("Alex Smith");
    fireEvent.click(nameHeading);
    
    const input = await screen.findByRole("textbox");
    expect(input).toBeTruthy();
    
    // Cancel editing
    const cancelBtn = screen.getByText("Cancel");
    fireEvent.click(cancelBtn);
    expect(screen.queryByRole("textbox")).toBeNull();
    
    // Open edit mode again
    fireEvent.click(screen.getByText("Alex Smith"));
    const input2 = await screen.findByRole("textbox");
    
    // Type new name
    fireEvent.change(input2, { target: { value: "Alexander" } });
    const saveBtn = screen.getByText("Save");
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        full_name: "Alexander",
        mobile_no: "",
        avatar_url: ""
      });
      expect(toast.success).toHaveBeenCalledWith("Name updated successfully");
    });
  });

  it("handles error when saving name", async () => {
    mockUpdateMutateAsync.mockRejectedValue(new Error("Failed"));
    render(<ProfileHeader profile={BASE_PROFILE} />)
    
    fireEvent.click(screen.getByText("Alex Smith"));
    const input = await screen.findByRole("textbox");
    fireEvent.change(input, { target: { value: "Alexander" } });
    fireEvent.click(screen.getByText("Save"));
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to update name");
    });
  });

  it("handles avatar file selection and upload correctly", async () => {
    const { container } = render(<ProfileHeader profile={BASE_PROFILE} />)
    
    // Click avatar to cover line 206
    const avatarFallback = screen.getByText("AS");
    fireEvent.click(avatarFallback);

    // We fire change on the hidden input directly
    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    
    // Test invalid file type
    const invalidFile = new File(["test"], "test.txt", { type: "text/plain" });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    expect(toast.error).toHaveBeenCalledWith("Only JPG and PNG files are allowed");
    
    // Test valid file type
    const validFile = new File(["image"], "avatar.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledWith(validFile);
      expect(mockUploadMutate).toHaveBeenCalled();
      expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
        full_name: "Alex Smith",
        mobile_no: "",
        avatar_url: "/files/avatar.png"
      });
      expect(toast.success).toHaveBeenCalledWith("Avatar updated successfully");
    });
  });

  it("handles error during file upload", async () => {
    mockUploadMutate = vi.fn((file, options) => {
      options.onError(new Error("Upload failed"));
    });
    (useFileUpload as any).mockReturnValue({ mutate: mockUploadMutate, isPending: false });
    
    const { container } = render(<ProfileHeader profile={BASE_PROFILE} />)
    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const validFile = new File(["image"], "avatar.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Upload failed");
    });
  });
  
  it("handles error during profile update after file upload", async () => {
    mockUpdateMutateAsync.mockRejectedValue(new Error("Update failed"));
    
    const { container } = render(<ProfileHeader profile={BASE_PROFILE} />)
    const fileInput = container.querySelector("input[type='file']") as HTMLInputElement;
    const validFile = new File(["image"], "avatar.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Update failed");
    });
  });
});
