// app/open-jobs/[id]/apply/page.tsx

import JobApplicantForm from "@/components/jobs/job-applicant-form";

export default function ApplyPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="">
      <JobApplicantForm jobID={params.id} />
    </div>
  );
}