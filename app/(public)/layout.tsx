import { redirect } from "next/navigation";
import { CareersShell } from "@/components/careers/careers-shell";
import { isServerFeatureEnabled } from "@/lib/server/feature-flags";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // When the public careers mode is off, every /, /jobs, /ai-match hit
  // must land on /login — this is the pre-PR behaviour the project depends on.
  const enabled = await isServerFeatureEnabled("careers_public_enabled");
  if (!enabled) {
    redirect("/login");
  }
  return <CareersShell>{children}</CareersShell>;
}
