import { useMutation } from "@tanstack/react-query";
import { profileService } from "../services/uploadProofFile";

export const useFileUpload = () => {
  return useMutation({
    mutationKey: ["uploadFile"],
    mutationFn: (file: File) => profileService.uploadFile(file),
    onError: (error) => {
      console.error("Error uploading file:", error);
    },
  });
};