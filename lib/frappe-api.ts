// src/lib/frappe-api.ts

function getFrappeUrl() {
  const configuredUrl = (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "localhost" &&
    configuredUrl.startsWith("http://127.0.0.1:")
  ) {
    return configuredUrl.replace("http://127.0.0.1:", "http://localhost:");
  }
  return configuredUrl;
}

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
      `${getFrappeUrl()}/api/method/upload_file`,
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
    const url = `${getFrappeUrl()}/api/method/${method}${queryString ? `?${queryString}` : ""
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

    const url = `${getFrappeUrl()}/api/resource/${resource}${queryString ? `?${queryString}` : ""
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
    const url = `${getFrappeUrl()}/api/method/${method}${queryString ? `?${queryString}` : ""
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
    const url = `${getFrappeUrl()}/api/method/${method}`;

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

  getresourceDocumentData: async (
    doctype: string,
    options?: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      name?: string;
      fields?: string[];
       
      filters?: string[] | Record<string, any>;
       
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

    let url = `${getFrappeUrl()}/api/resource/${doctype}`;

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
