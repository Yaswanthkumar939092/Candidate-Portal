import { useMutation } from "@tanstack/react-query";
import { profileService, ChangePasswordData } from "../services/profileService";

export const useChangePassword = () => {
  return useMutation({
    mutationKey: ["changePassword"],
    mutationFn: (data: ChangePasswordData) =>
      profileService.changePassword(data),
    onError: (error) => {
      console.error("Error changing password:", error);
    },
  });
};
