import type { NextConfig } from "next";

function getRemoteImagePatterns() {
  const configuredFrappeUrl =
    process.env.NEXT_PUBLIC_FRAPPE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : undefined);

  if (!configuredFrappeUrl) {
    return [];
  }

  try {
    const { protocol, hostname, port } = new URL(configuredFrappeUrl);

    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port,
        pathname: "/**",
      },
    ];
  } catch {
    console.warn(
      "Invalid NEXT_PUBLIC_FRAPPE_URL provided. External Frappe-hosted images will not be optimized.",
    );
    return [];
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  images: {
    remotePatterns: getRemoteImagePatterns(),
    domains: ['upload.wikimedia.org'],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
