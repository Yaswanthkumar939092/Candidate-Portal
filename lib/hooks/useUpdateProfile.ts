import { useMutation } from "@tanstack/react-query";
import { profileService, UpdateProfileData } from "../services/profileService";
import { useAuth } from "../contexts/auth-context";

export const useUpdateProfile = () => {
  const { refreshProfile } = useAuth();

  return useMutation({
    mutationKey: ["updateProfile"],
    mutationFn: (data: UpdateProfileData) => profileService.updateProfile(data),
    onSuccess: async () => {
      await refreshProfile();
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });
};
