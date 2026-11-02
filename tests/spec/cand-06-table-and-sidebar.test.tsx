import { beforeEach, describe, expect, it, vi } from "vitest"
import { fireEvent, render, screen } from "@testing-library/react"
import { FieldValues, FormProvider, UseFormReturn, useForm } from "react-hook-form"

const h = vi.hoisted(() => ({ survey: { value: null as unknown } }))

vi.mock("@/lib/hooks/useSurvey", () => ({ useSurvey: () => ({ data: h.survey.value, isLoading: false, error: null }) }))
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock("@/components/ui/field-renderer", () => ({
  DynamicFieldRenderer: ({
    field,
    value,
    onChange,
  }: {
    field: { fieldname: string; label: string; options?: string; read_only?: number }
    value: unknown
    onChange: (v: unknown) => void
  }) => (
    <div
      data-testid={`field-${field.fieldname}`}
      data-options={field.options || ""}
      data-readonly={String(field.read_only ?? 0)}
    >
      <input
        data-testid={`input-${field.fieldname}`}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  ),
}))

import { DynamicTableField } from "@/components/onboarding/dynamic-table-field"
import { PortalStepperSidebar } from "@/components/portal/portal-stepper-sidebar"

function Harness({
  children,
  defaultValues = {},
}: {
  children: (methods: UseFormReturn<FieldValues>) => React.ReactNode
  defaultValues?: FieldValues
}) {
  const methods = useForm({ defaultValues })
  return <FormProvider {...methods}>{children(methods as unknown as UseFormReturn<FieldValues>)}</FormProvider>
}

const familyField = {
  fieldname: "custom_family_details",
  label: "Family Details",
  fieldtype: "Table",
  hidden: 0,
  is_mandatory: 0,
  read_only: 0,
  child_fields: [
    {
      fieldname: "relation",
      label: "Relation",
      fieldtype: "Select",
      options: "Father\nMother\nSpouse",
      hidden: 0,
      is_mandatory: 0,
      read_only: 0,
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  h.survey.value = null
})

describe("DynamicTableField relation options", () => {
  // Spec: CAND-06-A6.3A (docs/spec/clauses/06-onboarding-components.md#cand-06-a6-3a)
  // Characterization: pins current behaviour, not endorsed.
  it("removes a relation already chosen in another row from the remaining rows' options", () => {
    render(
      <Harness defaultValues={{ custom_family_details: [{ relation: "Father" }, { relation: "" }] }}>
        {(m) => (
          <DynamicTableField
            field={familyField}
            control={m.control}
            setValue={m.setValue}
            errors={m.formState.errors}
          />
        )}
      </Harness>,
    )
    const rows = screen.getAllByTestId("field-relation")
    expect(rows[0].getAttribute("data-options")).toContain("Father")
    expect(rows[1].getAttribute("data-options")).not.toContain("Father")
    expect(rows[1].getAttribute("data-options")).toContain("Mother")
  })

  // Spec: CAND-06-A6.3B (docs/spec/clauses/06-onboarding-components.md#cand-06-a6-3b)
  // Characterization: pins current behaviour, not endorsed.
  it("hides the add button once every relation option has been used, because the option list has no Child entry", () => {
    render(
      <Harness
        defaultValues={{
          custom_family_details: [{ relation: "Father" }, { relation: "Mother" }, { relation: "Spouse" }],
        }}
      >
        {(m) => (
          <DynamicTableField
            field={familyField}
            control={m.control}
            setValue={m.setValue}
            errors={m.formState.errors}
          />
        )}
      </Harness>,
    )
    expect(screen.queryByRole("button", { name: /Add Family Details/i })).toBeNull()
  })

  // Spec: CAND-06-A6.3C (docs/spec/clauses/06-onboarding-components.md#cand-06-a6-3c)
  // Characterization: pins current behaviour, not endorsed.
  it("keeps the add button when Child is among the options even if every option is already chosen", () => {
    const withChild = {
      ...familyField,
      child_fields: [{ ...familyField.child_fields[0], options: "Father\nChild" }],
    }
    render(
      <Harness defaultValues={{ custom_family_details: [{ relation: "Father" }, { relation: "Child" }] }}>
        {(m) => (
          <DynamicTableField
            field={withChild}
            control={m.control}
            setValue={m.setValue}
            errors={m.formState.errors}
          />
        )}
      </Harness>,
    )
    expect(screen.getByRole("button", { name: /Add Family Details/i })).toBeTruthy()
  })
})

describe("DynamicTableField read-only table", () => {
  // Spec: CAND-06-A6.4A (docs/spec/clauses/06-onboarding-components.md#cand-06-a6-4a)
  // Characterization: pins current behaviour, not endorsed.
  it("drops the add and remove buttons and marks every child read-only when the table is read-only", () => {
    render(
      <Harness defaultValues={{ custom_family_details: [{ relation: "Father" }, { relation: "Mother" }] }}>
        {(m) => (
          <DynamicTableField
            field={{ ...familyField, read_only: 1 }}
            control={m.control}
            setValue={m.setValue}
            errors={m.formState.errors}
          />
        )}
      </Harness>,
    )
    expect(screen.queryByRole("button", { name: /Add Family Details/i })).toBeNull()
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    for (const row of screen.getAllByTestId("field-relation")) {
      expect(row.getAttribute("data-readonly")).toBe("1")
    }
  })
})

describe("PortalStepperSidebar expanded items", () => {
  // Spec: CAND-06-A9.2A (docs/spec/clauses/06-onboarding-components.md#cand-06-a9-2a)
  // Characterization: pins current behaviour, not endorsed.
  it("lists the expanded items under the current step and reports the clicked index", () => {
    const onItemSelect = vi.fn()
    render(
      <PortalStepperSidebar
        currentStep="offer"
        expandedItems={[
          { id: "ctc", label: "CTC Breakup" },
          { id: "terms", label: "Terms" },
        ]}
        activeItemIndex={0}
        onItemSelect={onItemSelect}
      />,
    )
    fireEvent.click(screen.getByText("Terms"))
    expect(onItemSelect).toHaveBeenCalledWith(1)
  })

  // Spec: CAND-06-A9.2B (docs/spec/clauses/06-onboarding-components.md#cand-06-a9-2b)
  // Characterization: pins current behaviour, not endorsed.
  it("collapses and re-expands the item list when the step header is clicked", () => {
    render(
      <PortalStepperSidebar
        currentStep="offer"
        expandedItems={[{ id: "ctc", label: "CTC Breakup" }]}
        activeItemIndex={0}
        onItemSelect={vi.fn()}
      />,
    )
    expect(screen.getByText("CTC Breakup")).toBeTruthy()
    fireEvent.click(screen.getByText("Offer Preview", { selector: "span" }))
    expect(screen.queryByText("CTC Breakup")).toBeNull()
    fireEvent.click(screen.getByText("Offer Preview", { selector: "span" }))
    expect(screen.getByText("CTC Breakup")).toBeTruthy()
  })
})
