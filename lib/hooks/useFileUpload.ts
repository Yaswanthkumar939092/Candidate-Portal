import { useMutation } from "@tanstack/react-query";
import { fileUploadService } from "../services/uploadProofFile";

export const useFileUpload = () => {
  return useMutation({
    mutationKey: ["uploadFile"],
    mutationFn: (file: File) => fileUploadService.uploadFile(file),
    onError: (error) => {
      console.error("Error uploading file:", error);
    },
  });
};