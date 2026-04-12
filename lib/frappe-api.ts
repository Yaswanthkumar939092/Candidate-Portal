/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/frappe-api.ts

export const FrappeAPI = {
  uploadFile: async (
    file: File,
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

  get: async (method: string, params: Record<string, string> = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${process.env.NEXT_PUBLIC_FRAPPE_URL}/api/method/${method}${
      queryString ? `?${queryString}` : ""
    }`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.message;
  },

  getResource: async (resource: string, params: Record<string, string> = {}) => {
    let queryString = new URLSearchParams(params).toString();
    // The user specifically requested unencoded brackets for the array query params
    queryString = queryString.replace(/%5B/g, '[').replace(/%5D/g, ']');

    const url = `${process.env.NEXT_PUBLIC_FRAPPE_URL}/api/resource/${resource}${
      queryString ? `?${queryString}` : ""
    }`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.statusText}`);
    }

    // /api/resource returns { data: [...] } instead of { message: ... }
    const responseData = await res.json();
    return responseData;
  },

  getBlob: async (method: string, params: Record<string, string> = {}): Promise<Blob> => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${process.env.NEXT_PUBLIC_FRAPPE_URL}/api/method/${method}${
      queryString ? `?${queryString}` : ""
    }`;

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.statusText}`);
    }

    return res.blob();
  },

  post: async (method: string, body: Record<string, unknown>) => {
    const url = `${process.env.NEXT_PUBLIC_FRAPPE_URL}/api/method/${method}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`API request failed: ${res.statusText}`);
    }

    const data = await res.json();
    return data.message;
  },
};