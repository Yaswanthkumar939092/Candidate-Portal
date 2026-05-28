import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DynamicSurveyForm } from "@/components/survey/dynamic-survey-form";

// Mock shadcn component inputs so we can test them easily with standard testing library APIs
vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({ checked, onCheckedChange, id, disabled, "aria-invalid": ariaInvalid }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      onChange={(e) => onCheckedChange(e.target.checked)}
      data-testid={id}
    />
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ type, onChange, ...props }: any) => (
    <input
      {...props}
      type={type === "number" ? "text" : type}
      onChange={(e) => {
        if (type === "number") {
          const val = e.target.value;
          const num = Number(val);
          Object.defineProperty(e.target, "valueAsNumber", {
            value: val === "" ? NaN : num,
            configurable: true,
          });
        }
        onChange?.(e);
      }}
    />
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => (
    <select
      value={value ?? ""}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled}
      data-testid="mock-select"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children, id }: any) => <div id={id}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <option value="" disabled>{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value} data-testid={`option-${value}`}>
      {children}
    </option>
  ),
}));

describe("DynamicSurveyForm", () => {
  it("renders empty when schema is empty, null, or undefined", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();

    const { container } = render(
      <DynamicSurveyForm
        schema={null}
        values={{}}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    expect(container.querySelector("form")).toBeTruthy();
    expect(container.querySelector("button[type='submit']")).toBeTruthy();
  });

  it("renders textfield, textarea, email, number, url, password and basic inputs", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        { key: "name", type: "textfield", label: "Full Name", placeholder: "Enter name" },
        { key: "bio", type: "textarea", label: "Biography", placeholder: "Tell us about yourself" },
        { key: "emailAddress", type: "email", label: "Email Address" },
        { key: "age", type: "number", label: "Age" },
        { key: "website", type: "url", label: "Website" },
        { key: "pw", type: "password", label: "Password" },
        { key: "phone", type: "phoneNumber", label: "Phone Number" },
        { key: "dt", type: "datetime", label: "Date Time" },
        { key: "dayField", type: "day", label: "Day Field" },
      ],
    };

    render(
      <DynamicSurveyForm
        schema={schema}
        values={{}}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText("Full Name")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter name")).toBeTruthy();
    expect(screen.getByLabelText("Biography")).toBeTruthy();
    expect(screen.getByLabelText("Email Address")).toBeTruthy();
    expect(screen.getByLabelText("Age")).toBeTruthy();
    expect(screen.getByLabelText("Website")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
    expect(screen.getByLabelText("Phone Number")).toBeTruthy();
    expect(screen.getByLabelText("Date Time")).toBeTruthy();
    expect(screen.getByLabelText("Day Field")).toBeTruthy();
  });

  it("handles basic input change events and triggers onValuesChange", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        { key: "name", type: "textfield", label: "Full Name" },
      ],
    };

    render(
      <DynamicSurveyForm
        schema={schema}
        values={{ name: "" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    const input = screen.getByLabelText("Full Name");
    fireEvent.change(input, { target: { value: "John Doe" } });
    expect(onValuesChange).toHaveBeenCalledWith({ name: "John Doe" });
  });

  it("converts input to numbers correctly, including NaN values", () => {
    const onValuesChange = vi.fn();
    const schema = {
      components: [
        { key: "numVal", type: "number", label: "Number Input" },
      ],
    };

    function TestWrapper() {
      const [values, setValues] = React.useState<any>({});
      return (
        <DynamicSurveyForm
          schema={schema}
          values={values}
          onValuesChange={(next) => {
            setValues(next);
            onValuesChange(next);
          }}
          onSubmit={vi.fn()}
        />
      );
    }

    render(<TestWrapper />);

    const input = screen.getByLabelText("Number Input");

    // Standard number input change
    fireEvent.change(input, { target: { value: "42" } });
    expect(onValuesChange).toHaveBeenLastCalledWith({ numVal: 42 });

    // Test invalid / empty numeric string
    fireEvent.change(input, { target: { value: "" } });
    expect(onValuesChange).toHaveBeenLastCalledWith({ numVal: "" });
  });

  it("renders checkbox input, triggers change, and renders description", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        { key: "agree", type: "checkbox", label: "Agree to terms", description: "Terms description" },
      ],
    };

    render(
      <DynamicSurveyForm
        schema={schema}
        values={{ agree: false }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText("Terms description")).toBeTruthy();
    const checkbox = screen.getByTestId("survey-agree");
    fireEvent.click(checkbox);
    expect(onValuesChange).toHaveBeenCalledWith({ agree: true });
  });

  it("renders selectbox and handles multiple checkbox values", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        {
          key: "hobbies",
          type: "selectboxes",
          label: "Hobbies",
          values: [
            { label: "Reading", value: "read" },
            { label: "Gaming", value: "game" },
          ],
        },
      ],
    };

    render(
      <DynamicSurveyForm
        schema={schema}
        values={{ hobbies: { read: true } }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText("Reading")).toBeTruthy();
    expect(screen.getByText("Gaming")).toBeTruthy();

    const gamingCheckbox = screen.getByLabelText("Gaming");
    fireEvent.click(gamingCheckbox);

    expect(onValuesChange).toHaveBeenCalledWith({
      hobbies: { read: true, game: true },
    });
  });

  it("renders radio options and handles selection", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        {
          key: "gender",
          type: "radio",
          label: "Gender",
          values: [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ],
        },
      ],
    };

    render(
      <DynamicSurveyForm
        schema={schema}
        values={{ gender: "male" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    const femaleRadio = screen.getByLabelText("Female");
    fireEvent.click(femaleRadio);
    expect(onValuesChange).toHaveBeenCalledWith({ gender: "female" });
  });

  it("renders select options and handles dropdown changes", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        {
          key: "country",
          type: "select",
          label: "Country",
          data: {
            values: [
              { label: "USA", value: "us" },
              { label: "Canada", value: "ca" },
            ],
          },
        },
      ],
    };

    render(
      <DynamicSurveyForm
        schema={schema}
        values={{ country: "us" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    const select = screen.getByTestId("mock-select");
    fireEvent.change(select, { target: { value: "ca" } });
    expect(onValuesChange).toHaveBeenCalledWith({ country: "ca" });
  });

  it("renders nested columns and generic container components, and flattens rows for onSubmit", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        {
          type: "columns",
          columns: [
            {
              components: [{ key: "col1", type: "textfield", label: "Col 1" }],
            },
          ],
        },
        {
          type: "rows",
          rows: [
            [
              {
                components: [{ key: "row1", type: "textfield", label: "Row 1" }],
              },
            ],
          ],
        },
        {
          type: "container",
          label: "Generic Container",
          components: [
            { key: "cont1", type: "textfield", label: "Cont 1" },
          ],
        },
      ],
    };

    render(
      <DynamicSurveyForm
        schema={schema}
        values={{ row1: "row-val" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText("Col 1")).toBeTruthy();
    expect(screen.queryByLabelText("Row 1")).toBeNull();
    expect(screen.getByText("Generic Container")).toBeTruthy();
    expect(screen.getByLabelText("Cont 1")).toBeTruthy();

    const submitBtn = screen.getByRole("button", { name: /Submit Responses/i });
    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalledWith({
      col1: "",
      row1: "row-val",
      cont1: "",
    });
  });

  it("validates required fields, minLength, maxLength, pattern, and custom validators", async () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        {
          key: "field1",
          type: "textfield",
          label: "Field 1",
          validate: { required: true, minLength: 3, maxLength: 5 },
        },
        {
          key: "emailField",
          type: "email",
          label: "Email Field",
        },
        {
          key: "patternField",
          type: "textfield",
          label: "Pattern Field",
          validate: { pattern: "^[A-Z]+$", customMessage: "Must be uppercase letters" },
        },
        {
          key: "numField",
          type: "number",
          label: "Number Field",
          validate: { min: 5, max: 10 },
        },
        {
          key: "customValField",
          type: "textfield",
          label: "Custom Val Field",
          validate: { custom: "valid = input === 'correct' ? true : 'must be correct';" },
        },
      ],
    };

    const { rerender } = render(
      <DynamicSurveyForm
        schema={schema}
        values={{}}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    // Submit while fields are empty to trigger required
    const submitBtn = screen.getByRole("button", { name: /Submit Responses/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText("Field 1 is required.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();

    // Rerender with values failing minLength
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "ab" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(await screen.findByText("Field 1 must be at least 3 characters.")).toBeTruthy();

    // Rerender with values failing maxLength
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "abcdef" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(await screen.findByText("Field 1 must be 5 characters or fewer.")).toBeTruthy();

    // Rerender with invalid email format
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "abc", emailField: "not-an-email" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(await screen.findByText("Enter a valid email address.")).toBeTruthy();

    // Rerender with invalid regex pattern
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "abc", emailField: "test@domain.com", patternField: "lowercase" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(await screen.findByText("Must be uppercase letters")).toBeTruthy();

    // Rerender with NaN for number field
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "abc", emailField: "test@domain.com", patternField: "ABC", numField: "not-a-number" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(await screen.findByText("Number Field must be a number.")).toBeTruthy();

    // Rerender with number field out of bounds (too small)
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "abc", emailField: "test@domain.com", patternField: "ABC", numField: 4 }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(await screen.findByText("Number Field must be at least 5.")).toBeTruthy();

    // Rerender with number field out of bounds (too large)
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "abc", emailField: "test@domain.com", patternField: "ABC", numField: 11 }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(await screen.findByText("Number Field must be no more than 10.")).toBeTruthy();

    // Rerender with custom validation failing
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "abc", emailField: "test@domain.com", patternField: "ABC", numField: 8, customValField: "wrong" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(await screen.findByText("must be correct")).toBeTruthy();

    // Rerender with all valid values to successfully submit
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ field1: "abc", emailField: "test@domain.com", patternField: "ABC", numField: 8, customValField: "correct" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenLastCalledWith({
      field1: "abc",
      emailField: "test@domain.com",
      patternField: "ABC",
      numField: 8,
      customValField: "correct",
    });
  });

  it("handles catch blocks in regex patterns and custom validators", async () => {
    const onSubmit = vi.fn();
    const schema = {
      components: [
        {
          key: "badPatternField",
          type: "textfield",
          label: "Bad Pattern Field",
          validate: { pattern: "[" }, // Throws on RegExp compilation
        },
        {
          key: "badCustomField",
          type: "textfield",
          label: "Bad Custom Field",
          validate: {
            custom: "throw new Error('boom');",
            customMessage: "Custom error fallback",
          },
        },
        {
          key: "badCustomNoMsgField",
          type: "textfield",
          label: "Bad Custom No Message Field",
          validate: {
            custom: "throw new Error('boom');",
          },
        },
      ],
    };

    const { rerender } = render(
      <DynamicSurveyForm
        schema={schema}
        values={{
          badPatternField: "abc",
          badCustomField: "some-value",
          badCustomNoMsgField: "some-value",
        }}
        onValuesChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Submit Responses/i });
    fireEvent.click(submitBtn);

    // badPatternField's invalid regex will catch and return null (no error text is shown)
    expect(screen.queryByText("Bad Pattern Field has an invalid format.")).toBeNull();

    // badCustomField throws and returns the customMessage
    expect(await screen.findByText("Custom error fallback")).toBeTruthy();

    // Rerender to test throw fallback when customMessage is omitted (returns null, no error shown)
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ badCustomField: "some-val" }}
        onValuesChange={vi.fn()}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(submitBtn);
    expect(screen.queryByText("Bad Custom No Message Field is invalid.")).toBeNull();
  });

  it("hides fields conditionally using simple 'when/eq' logic, json-logic, and custom conditionals", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();
    const schema = {
      components: [
        { key: "triggerField", type: "textfield", label: "Trigger" },
        {
          key: "conditionalField",
          type: "textfield",
          label: "Simple Cond Field",
          conditional: { when: "triggerField", eq: "show" },
        },
        {
          key: "jsonCondField",
          type: "textfield",
          label: "JSON Cond Field",
          conditional: {
            json: {
              and: [
                { "===": [{ var: "data.triggerField" }, "show"] },
              ],
            },
          },
        },
        {
          key: "customCondField",
          type: "textfield",
          label: "Custom Cond Field",
          customConditional: "show = data.triggerField === 'show';",
        },
      ],
    };

    const { rerender } = render(
      <DynamicSurveyForm
        schema={schema}
        values={{ triggerField: "" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    // Initially conditional fields are hidden
    expect(screen.queryByLabelText("Simple Cond Field")).toBeNull();
    expect(screen.queryByLabelText("JSON Cond Field")).toBeNull();
    expect(screen.queryByLabelText("Custom Cond Field")).toBeNull();

    // Rerender with matching value
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ triggerField: "show" }}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByLabelText("Simple Cond Field")).toBeTruthy();
    expect(screen.getByLabelText("JSON Cond Field")).toBeTruthy();
    expect(screen.getByLabelText("Custom Cond Field")).toBeTruthy();
  });

  it("handles conditional show: false scenarios", () => {
    const schema = {
      components: [
        { key: "triggerField", type: "textfield", label: "Trigger" },
        {
          key: "hideField",
          type: "textfield",
          label: "Hide Field",
          conditional: { when: "triggerField", eq: "hide-me", show: false },
        },
      ],
    };

    const { rerender } = render(
      <DynamicSurveyForm
        schema={schema}
        values={{ triggerField: "something-else" }}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Hide Field")).toBeTruthy();

    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ triggerField: "hide-me" }}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByLabelText("Hide Field")).toBeNull();
  });

  it("evaluates conditional JSON Logic expression nodes including 'or', '!', '==', and nested vars", () => {
    const schema = {
      components: [
        { key: "valueA", type: "textfield", label: "Value A" },
        { key: "valueB", type: "textfield", label: "Value B" },
        {
          key: "jsonField",
          type: "textfield",
          label: "JSON Field",
          conditional: {
            json: {
              or: [
                { "!": { "==": [{ var: "data.valueA" }, "hidden"] } },
                { "===": [{ var: "data.valueB" }, "visible"] },
              ],
            },
          },
        },
      ],
    };

    const { rerender } = render(
      <DynamicSurveyForm
        schema={schema}
        values={{ valueA: "hidden", valueB: "not-visible" }}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // False OR False => hidden
    expect(screen.queryByLabelText("JSON Field")).toBeNull();

    // Rerender: True OR False => visible
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ valueA: "something-else", valueB: "not-visible" }}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByLabelText("JSON Field")).toBeTruthy();
  });

  it("handles errors and non-boolean results in custom conditionals", () => {
    const schema = {
      components: [
        {
          key: "brokenCond",
          type: "textfield",
          label: "Broken Cond",
          customConditional: "throw new Error('broken');",
        },
        {
          key: "nonBoolCond",
          type: "textfield",
          label: "Non Boolean Cond",
          // sets show to null, so it falls back to visible which is false
          customConditional: "show = null; visible = false;",
        },
      ],
    };

    render(
      <DynamicSurveyForm
        schema={schema}
        values={{}}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Broken conditional catches exception and shows component
    expect(screen.getByLabelText("Broken Cond")).toBeTruthy();

    // Non-boolean returns visible fallback (false)
    expect(screen.queryByLabelText("Non Boolean Cond")).toBeNull();
  });

  it("handles isSubmitting prop properly by disabling the submit button", () => {
    const onValuesChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <DynamicSurveyForm
        schema={{ components: [] }}
        values={{}}
        onValuesChange={onValuesChange}
        onSubmit={onSubmit}
        isSubmitting={true}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Submitting.../i });
    expect(submitBtn).toBeTruthy();
    expect(submitBtn.hasAttribute("disabled")).toBe(true);
  });

  it("removes errors when field value changes to valid", async () => {
    const schema = {
      components: [
        { key: "username", type: "textfield", label: "Username", validate: { required: true } },
      ],
    };

    const { rerender } = render(
      <DynamicSurveyForm
        schema={schema}
        values={{ username: "" }}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole("button", { name: /Submit Responses/i });
    fireEvent.click(submitBtn);

    // Shows the error first
    expect(await screen.findByText("Username is required.")).toBeTruthy();

    // Simulate type to change value
    const input = screen.getByLabelText(/Username/i);
    fireEvent.change(input, { target: { value: "valid_user" } });

    // The component checks if errors[key] is truthy, then re-runs validation
    // and updates errors array to empty string. Let's rerender to verify
    rerender(
      <DynamicSurveyForm
        schema={schema}
        values={{ username: "valid_user" }}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.queryByText("Username is required.")).toBeNull();
  });

  it("handles textarea input changes", () => {
    const onValuesChange = vi.fn();
    const schema = {
      components: [
        { key: "bio", type: "textarea", label: "Biography" },
      ],
    };
    render(
      <DynamicSurveyForm
        schema={schema}
        values={{}}
        onValuesChange={onValuesChange}
        onSubmit={vi.fn()}
      />
    );
    const textarea = screen.getByLabelText("Biography");
    fireEvent.change(textarea, { target: { value: "My long bio" } });
    expect(onValuesChange).toHaveBeenCalledWith({ bio: "My long bio" });
  });

  it("returns true for unsupported JSON conditional operators by default", () => {
    const schema = {
      components: [
        {
          key: "fallbackField",
          type: "textfield",
          label: "Fallback Field",
          conditional: {
            json: { unsupported_op: "anything" },
          },
        },
      ],
    };
    render(
      <DynamicSurveyForm
        schema={schema}
        values={{}}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Fallback Field")).toBeTruthy();
  });
});
