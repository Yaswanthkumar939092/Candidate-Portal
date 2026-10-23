import { CareersShell } from "@/components/careers/careers-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <CareersShell>{children}</CareersShell>;
}
