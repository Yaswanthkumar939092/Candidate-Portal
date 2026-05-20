import { FrappeAPI } from "../frappe-api";


export const profileService = {
  uploadFile: async (
    file: File,
    doctype?: string,
    docName?: string
  ): Promise<{ file_url: string; name: string }> => {
    console.log("Uploading file:", file) 
    try {
      const result = await FrappeAPI.uploadFile(file, "", docName, doctype);
      return result;
    } catch (error) {
      console.error("Failed to upload file:", error);
      throw error;
    }
  },
};