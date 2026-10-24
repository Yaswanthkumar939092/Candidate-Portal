import { FileText, LogIn, Sparkles } from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Choose your resume", body: "Drop a PDF, DOC, DOCX or TXT file." },
  { icon: LogIn, title: "Log in", body: "We take you to login as soon as the file is selected." },
  { icon: Sparkles, title: "Get matched", body: "Back in the portal, your resume is matched with suitable open jobs." },
];

/** Explains the public resume-to-match journey before the login handoff. */
export function ResumeMatchSteps() {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {STEPS.map(({ icon: Icon, title, body }, index) => (
        <li key={title} className="rounded-2xl border bg-card p-4">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h2 className="mt-3 text-sm font-semibold">
            {index + 1}. {title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </li>
      ))}
    </ol>
  );
}
