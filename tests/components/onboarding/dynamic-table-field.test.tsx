import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DynamicTableField } from "@/components/onboarding/dynamic-table-field";
import { useForm, FormProvider, UseFormReturn, FieldValues, FieldErrors } from "react-hook-form";
import { OnboardingField } from "@/lib/types/onboarding";

interface DynamicFieldRendererProps {
  field: OnboardingField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}

interface WrapperProps {
  children: (methods: UseFormReturn<FieldValues>) => React.ReactNode;
  defaultValues?: FieldValues;
}

// Mocking DynamicFieldRenderer since it's used inside
vi.mock("@/components/ui/field-renderer", () => ({
  DynamicFieldRenderer: ({ field, value, onChange, error }: DynamicFieldRendererProps) => (
    <div data-testid={`field-${field.fieldname}`}>
      <label>{field.label}</label>
      <input 
        value={(value as string) || ""} 
        onChange={(e) => onChange(e.target.value)} 
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
            watch={methods.watch}
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
            watch={methods.watch}
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

  it("can remove a row when more than one exists", () => {
    render(
      <Wrapper defaultValues={{ education: [{}, {}] }}>
        {(methods) => (
          <DynamicTableField
            field={mockTableField}
            control={methods.control}
            setValue={methods.setValue}
            watch={methods.watch}
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
            watch={methods.watch}
            errors={errors as unknown as FieldErrors<FieldValues>}
          />
        )}
      </Wrapper>
    );

    expect(screen.getByTestId("error-degree")).toHaveTextContent("Degree is required");
  });
});
