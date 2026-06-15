import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DynamicTableField } from "@/components/onboarding/dynamic-table-field";
import { useForm, FormProvider, UseFormReturn, FieldValues, FieldErrors } from "react-hook-form";
import { OnboardingField } from "@/lib/types/onboarding";

interface DynamicFieldRendererProps {
  field: OnboardingField;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur?: () => void;
  error?: string;
}

interface WrapperProps {
  children: (methods: UseFormReturn<FieldValues>) => React.ReactNode;
  defaultValues?: FieldValues;
}

// Mocking DynamicFieldRenderer since it's used inside
vi.mock("@/components/ui/field-renderer", () => ({
  DynamicFieldRenderer: ({ field, value, onChange, onBlur, error }: DynamicFieldRendererProps) => (
    <div data-testid={`field-${field.fieldname}`}>
      <label>{field.label}</label>
      <input 
        value={(value as string) || ""} 
        onChange={(e) => onChange(e.target.value)} 
        onBlur={onBlur}
        data-testid={`input-${field.fieldname}`}
      />
      {error && <span data-testid={`error-${field.fieldname}`}>{error}</span>}
    </div>
  ),
}));

const Wrapper = ({ children, defaultValues = {} }: WrapperProps) => {
  const methods = useForm({ defaultValues });
  return (
    <FormProvider {...methods}>
      {children(methods as unknown as UseFormReturn<FieldValues>)}
    </FormProvider>
  );
};

describe("DynamicTableField", () => {
  const mockTableField: OnboardingField = {
    fieldname: "education",
    label: "Education",
    is_mandatory: 1,
    read_only: 0,
    hidden: 0,
    fieldtype: "Table",
    child_fields: [
      { fieldname: "degree", label: "Degree", fieldtype: "Data", reqd: 1, is_mandatory: 1, read_only: 0, hidden: 0 },
      { fieldname: "year", label: "Year", fieldtype: "Int", is_mandatory: 0, read_only: 0, hidden: 0 }
    ]
  };

  it("initializes with one empty row if none exist", () => {
    render(
      <Wrapper>
        {(methods) => (
          <DynamicTableField
            field={mockTableField}
            control={methods.control}
            setValue={methods.setValue}
            errors={methods.formState.errors as unknown as FieldErrors<FieldValues>}
          />
        )}
      </Wrapper>
    );

    expect(screen.getByText("Education")).toBeTruthy();
    expect(screen.getAllByTestId("field-degree")).toHaveLength(1);
    expect(screen.getAllByTestId("field-year")).toHaveLength(1);
  });

  it("can add a new row by clicking 'Add Education'", () => {
    render(
      <Wrapper>
        {(methods) => (
          <DynamicTableField
            field={mockTableField}
            control={methods.control}
            setValue={methods.setValue}
            errors={methods.formState.errors as unknown as FieldErrors<FieldValues>}
          />
        )}
      </Wrapper>
    );

    const addButton = screen.getByRole("button", { name: /Add Education/i });
    fireEvent.click(addButton);

    expect(screen.getAllByTestId("field-degree")).toHaveLength(2);
    expect(screen.getAllByTestId("field-year")).toHaveLength(2);
  });

  it("does not show validation errors immediately for a newly added row", () => {
    const errors = {
      education: [
        {},
        { degree: { message: "Degree is required" } },
      ],
    };

    render(
      <Wrapper defaultValues={{ education: [{}] }}>
        {(methods) => (
          <DynamicTableField
            field={mockTableField}
            control={methods.control}
            setValue={methods.setValue}
            errors={errors as unknown as FieldErrors<FieldValues>}
          />
        )}
      </Wrapper>
    );

    fireEvent.click(screen.getByRole("button", { name: /Add Education/i }));

    expect(screen.getAllByTestId("field-degree")).toHaveLength(2);
    expect(screen.queryByTestId("error-degree")).toBeNull();
  });

  it("can remove a row when more than one exists", () => {
    render(
      <Wrapper defaultValues={{ education: [{}, {}] }}>
        {(methods) => (
          <DynamicTableField
            field={mockTableField}
            control={methods.control}
            setValue={methods.setValue}
            errors={methods.formState.errors as unknown as FieldErrors<FieldValues>}
          />
        )}
      </Wrapper>
    );

    expect(screen.getAllByTestId("field-degree")).toHaveLength(2);
    
    const removeButtons = screen.getAllByRole("button").filter(btn => btn.querySelector('svg')?.classList.contains('lucide-trash2'));
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);

    expect(screen.getAllByTestId("field-degree")).toHaveLength(1);
  });

  it("displays validation errors for specific rows and fields", () => {
    const errors = {
      education: [
        { degree: { message: "Degree is required" } },
        {}
      ]
    };

    render(
      <Wrapper defaultValues={{ education: [{}, {}] }}>
        {(methods) => (
          <DynamicTableField
            field={mockTableField}
            control={methods.control}
            setValue={methods.setValue}
            errors={errors as unknown as FieldErrors<FieldValues>}
          />
        )}
      </Wrapper>
    );

    expect(screen.queryByTestId("error-degree")).toBeNull();

    fireEvent.blur(screen.getAllByTestId("input-degree")[0]);

    expect(screen.getByTestId("error-degree")).toHaveTextContent("Degree is required");
  });

  it("renders container id and table-level validation error message", () => {
    const errors = {
      education: {
        type: "validate",
        message: "Total percentage must be 100%"
      }
    };

    const { container } = render(
      <Wrapper defaultValues={{ education: [{}] }}>
        {(methods) => (
          <DynamicTableField
            field={mockTableField}
            control={methods.control}
            setValue={methods.setValue}
            errors={errors as unknown as FieldErrors<FieldValues>}
          />
        )}
      </Wrapper>
    );

    const tableContainer = container.querySelector("#field-education");
    expect(tableContainer).toBeTruthy();
    expect(screen.getByText("Total percentage must be 100%")).toBeTruthy();
  });

  it("automatically clears years of passing on chronological violations", () => {
    const eduTableField: OnboardingField = {
      fieldname: "custom_education_details",
      label: "Education Details",
      is_mandatory: 1,
      read_only: 0,
      hidden: 0,
      fieldtype: "Table",
      child_fields: [
        { fieldname: "education_level", label: "Education Level", fieldtype: "Select", reqd: 1, is_mandatory: 1, read_only: 0, hidden: 0 },
        { fieldname: "year_of_passing", label: "Year of Passing", fieldtype: "Link", reqd: 1, is_mandatory: 1, read_only: 0, hidden: 0 }
      ]
    };

    const initialValues = {
      custom_education_details: [
        { education_level: "10th", year_of_passing: "2021" },
        { education_level: "12th", year_of_passing: "2022" }
      ]
    };

    render(
      <Wrapper defaultValues={initialValues}>
        {(methods) => (
          <DynamicTableField
            field={eduTableField}
            control={methods.control}
            setValue={methods.setValue}
            errors={methods.formState.errors as unknown as FieldErrors<FieldValues>}
          />
        )}
      </Wrapper>
    );

    const yearInputs = screen.getAllByTestId("input-year_of_passing") as HTMLInputElement[];
    expect(yearInputs).toHaveLength(2);
    expect(yearInputs[0].value).toBe("2021");
    expect(yearInputs[1].value).toBe("2022");

    // Change row 0 (10th) passing year to 2022, which is equal to row 1 (12th) passing year (2022)
    fireEvent.change(yearInputs[0], { target: { value: "2022" } });

    // Expect row 1 (12th) passing year to be automatically cleared to "" because it must be strictly after
    expect(yearInputs[1].value).toBe("");
  });
});
