import { describe, it, expect, vi } from "vitest";
import * as React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { TableField } from "@/components/direct-applicant-form/TableField";
import type { DirectApplicantField, TableRow } from "@/lib/types/direct-applicant-form";

let finishUpload: (v: { file_url: string; file_name: string }) => void = () => {};
vi.mock("@/lib/services/direct-applicant-form", () => ({
  directApplicantFormService: {
    searchLink: vi.fn().mockResolvedValue([]),
    uploadFile: vi.fn(() => new Promise((resolve) => { finishUpload = resolve; })),
  },
}));

const field: DirectApplicantField = {
  fieldname: "edu", label: "Education", fieldtype: "Table", reqd: 0, section: "S", value: [], editable: true,
  child: [
    { fieldname: "school", label: "School", fieldtype: "Data", reqd: 0 },
    { fieldname: "proof", label: "Proof", fieldtype: "Attach", reqd: 0 },
  ],
};

let latest: TableRow[] = [];
function Harness() {
  const [rows, setRows] = React.useState<TableRow[]>([{}, {}]);
  latest = rows;
  return <TableField access={{ request: "DAFR-1" }} field={field} rows={rows}
    onChange={(update) => setRows((current) => update(current))} />;
}

describe("TableField", () => {
  it("keeps edits made while an upload is still running", async () => {
    const { container } = render(<Harness />);
    const fileInputs = container.querySelectorAll('input[type="file"]');
    // Start an upload in row 1 ...
    fireEvent.change(fileInputs[0], { target: { files: [new File(["x"], "cv.pdf")] } });
    // ... type in row 2 while it runs ...
    fireEvent.change(screen.getByLabelText("School, row 2"), { target: { value: "IIT" } });
    // ... then the upload finishes.
    await act(async () => finishUpload({ file_url: "/private/files/cv.pdf", file_name: "cv.pdf" }));
    expect(latest[0].proof).toBe("/private/files/cv.pdf");
    expect(latest[1].school).toBe("IIT");
  });

  it("puts a late upload in its own row even if an earlier row is deleted", async () => {
    const { container } = render(<Harness />);
    const fileInputs = container.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[1], { target: { files: [new File(["x"], "cv.pdf")] } }); // row 2
    fireEvent.click(screen.getByLabelText("Remove row 1"));
    await act(async () => finishUpload({ file_url: "/private/files/cv.pdf", file_name: "cv.pdf" }));
    expect(latest).toHaveLength(1);
    expect(latest[0].proof).toBe("/private/files/cv.pdf");
  });
});
