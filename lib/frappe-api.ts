/* eslint-disable @typescript-eslint/no-explicit-any */
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

  // 🔥 Generic Resource API Method
  resource: async (
    doctype: string,
    options?: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      name?: string;
      fields?: string[];
      filters?: any[];
      data?: any;
      page?: number;   // ✅ added
      limit?: number;  // ✅ added
    }
  ) => {
    const {
      method = "GET",
      name,
      fields,
      filters,
      data,
      page = 1,        
      limit = 20,      
    } = options || {};
  
    let url = `${process.env.NEXT_PUBLIC_FRAPPE_URL}/api/resource/${doctype}`;
  
    // 👉 GET (List or Single)
    if (method === "GET") {
      if (name) {
        url += `/${name}`;
      } else {
        const params = new URLSearchParams();
  
        if (fields) {
          params.append("fields", JSON.stringify(fields));
        }
  
        if (filters) {
          params.append("filters", JSON.stringify(filters));
        }
  
        // ✅ Frappe pagination params
        params.append("limit_page_length", String(limit));
        params.append("limit_start", String((page - 1) * limit));
  
        url += `?${params.toString()}`;
      }
    }
  
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method !== "GET" ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
  
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "API request failed");
    }
  
    return res.json();
  },
};