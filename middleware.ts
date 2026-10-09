import { NextRequest, NextResponse } from "next/server";

// Keep the proxy inside Next.js. Unlike config rewrites, this reads the
// container's runtime environment rather than freezing the upstream at build.
export function middleware(request: NextRequest) {
  try {
    const target = new URL(process.env.FRAPPE_BASE_URL || "");
    if (
      !["http:", "https:"].includes(target.protocol) ||
      target.username || target.password || target.search || target.hash ||
      target.pathname !== "/"
    ) throw new Error("Invalid upstream");

    // Assign pathname rather than resolve user input as a URL: even //host
    // must remain a path on the configured upstream.
    target.pathname = request.nextUrl.pathname.slice("/backend".length) || "/";
    target.search = request.nextUrl.search;
    return NextResponse.rewrite(target);
  } catch {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}

export const config = {
  matcher: "/backend/:path*",
  runtime: "nodejs",
};
