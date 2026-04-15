// app/open-jobs/[id]/apply/page.tsx

import JobApplicationPage from "@/components/jobs/job-applicant/JobApplicantForm";
import { JobAppProvider } from "@/lib/contexts/job-application-context";

export default function ApplyPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="h-screen">
       <JobAppProvider>
      <JobApplicationPage jobID={params.id} />
      </JobAppProvider>
    </div>
  );
}