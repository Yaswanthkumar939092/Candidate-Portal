export const dynamic = "force-dynamic";

// Process health only: an upstream outage must not restart every portal pod.
export function GET() {
  return Response.json({ status: "ok" }, {
    headers: { "Cache-Control": "no-store" },
  });
}
