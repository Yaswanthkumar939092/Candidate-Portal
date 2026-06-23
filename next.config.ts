import type { NextConfig } from "next";

function getRemoteImagePatterns() {
  const configuredFrappeUrl =
    process.env.NEXT_PUBLIC_FRAPPE_URL ||
    (process.env.NODE_ENV === "development"
      ? // ? "http://localhost:8000"
        "http://localhost:8001"
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
      {
        protocol: "https" as const,
        hostname: "images.unsplash.com",
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

function getFrappeProxyTarget() {
  return (process.env.NEXT_PUBLIC_FRAPPE_URL || "").replace(/\/$/, "");
}

const nextConfig: NextConfig = {
  output: "standalone",
  // Same-origin reverse proxy to Frappe. Browser requests hit `/backend/...` on
  // our own origin and are forwarded to the Frappe host, which makes the
  // `candidate_portal_session` cookie first-party and keeps iOS Safari (WebKit
  // ITP) from dropping it. See lib/frappe-base.ts for the matching client base.
  async rewrites() {
    const target = getFrappeProxyTarget();
    if (!target) return [];
    return [
      {
        source: "/backend/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
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
    domains: ["upload.wikimedia.org"],
  },
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;

    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: "**/.playwright-mcp/**",
      };
    }

    return config;
  },
};

export default nextConfig;
