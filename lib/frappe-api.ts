// src/lib/frappe-api.ts

export const FrappeAPI = {
  uploadFile: async (
    file: File,
    folder = "",
    docName?: string,
    doctype?: string
  ) => {
    const formData = new FormData();
    formData.append("file", file);

    if (doctype) formData.append("doctype", doctype);
    if (docName) formData.append("docname", docName);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_FRAPPE_URL}/api/method/upload_file`,
      {
        method: "POST",
        body: formData,
        credentials: "include",
      }
    );

    if (!res.ok) {
      throw new Error("Upload failed");
    }

    const data = await res.json();
    return data.message;
  },
};