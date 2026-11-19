// app/open-jobs/[id]/apply/page.tsx

import JobApplicationPage from "@/components/jobs/job-applicant/JobApplicantForm";
import { jobOpeningFromParam } from "@/lib/careers/job-route";
import { JobAppProvider } from "@/lib/contexts/job-application-context";

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const id = jobOpeningFromParam((await params).id);
  return (
    <JobAppProvider job_opening={id} form_name="">
      <JobApplicationPage jobID={id} />
    </JobAppProvider>
  );
}
