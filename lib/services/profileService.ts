import { FrappeAPI } from "../frappe-api";

export interface UpdateProfileData {
  full_name?: string;
  mobile_no?: string;
  avatar_url?: string;
}

export interface ChangePasswordData {
  [key: string]: unknown;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export const profileService = {
  updateProfile: async (data: UpdateProfileData) => {
    try {
      const result = await FrappeAPI.post(
        "recruitment.api.candidate_auth.update_me",
        {
          data,
        },
      );
      return result;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  },

  changePassword: async (data: ChangePasswordData) => {
    try {
      const result = await FrappeAPI.post(
        "recruitment.api.candidate_auth.change_password",
        data,
      );
      return result;
    } catch (error) {
      console.error("Failed to change password:", error);
      throw error;
    }
  },
};
