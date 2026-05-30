import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  DynamicSurveyForm,
  type FormioComponent,
} from "@/components/survey/dynamic-survey-form";

vi.mock("@/components/ui/checkbox", () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    id,
    disabled,
    "aria-invalid": ariaInvalid,
  }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      data-testid={id}
    />
  ),
}));

vi.mock("@/components/ui/input", () => ({
  Input: ({ type, onChange, ...props }: any) => (
    <input
      {...props}
      type={type === "number" ? "text" : type}
      onChange={(event) => {
        if (type === "number") {
          const rawValue = event.target.value;
          Object.defineProperty(event.target, "valueAsNumber", {
            value: rawValue === "" ? Number.NaN : Number(rawValue),
            configurable: true,
          });
        }
        onChange?.(event);
      }}
    />
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => {
    const options: React.ReactElement[] = [];
    const collectOptions = (node: React.ReactNode) => {
      React.Children.forEach(node, (child) => {
        if (!React.isValidElement(child)) return;
        if (child.type === "option") {
          options.push(child);
          return;
        }
        if ((child.props as any).value !== undefined) {
          options.push(
            <option
              value={(child.props as any).value}
              data-testid={`option-${(child.props as any).value}`}
            >
              {(child.props as any).children}
            </option>,
          );
          return;
        }
        collectOptions((child.props as any).children);
      });
    };
    collectOptions(children);

    return (
      <select
        value={value ?? ""}
        onChange={(event) => onValueChange(event.target.value)}
        disabled={disabled}
        data-testid="mock-select"
      >
        <option value="" disabled>
          Select an option
        </option>
        {options}
      </select>
    );
  },
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value} data-testid={`option-${value}`}>
      {children}
    </option>
  ),
}));

function renderSurvey({
  components = [],
  values = {},
  onSubmit = vi.fn(),
  isSubmitting = false,
}: {
  components?: FormioComponent[];
  values?: Record<string, any>;
  onSubmit?: ReturnType<typeof vi.fn>;
  isSubmitting?: boolean;
} = {}) {
  render(
    <DynamicSurveyForm
      schema={{ components }}
      values={values}
      onValuesChange={vi.fn()}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
    />,
  );

  return {
    onSubmit,
    submit: () =>
      fireEvent.click(screen.getByRole("button", { name: /submit responses/i })),
  };
}

describe("DynamicSurveyForm", () => {
  it("renders a form and submit button for null, missing, or empty schemas", () => {
    const { container, rerender } = render(
      <DynamicSurveyForm
        schema={null}
        values={{}}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(container.querySelector("form")).toBeTruthy();
    expect(screen.getByRole("button", { name: /submit responses/i })).toBeTruthy();

    rerender(
      <DynamicSurveyForm
        values={{}}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /submit responses/i })).toBeTruthy();

    rerender(
      <DynamicSurveyForm
        schema={{ components: [] }}
        values={{}}
        onValuesChange={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /submit responses/i })).toBeTruthy();
  });

  it("renders supported text-like field types with labels, placeholders, descriptions, and disabled state", () => {
    renderSurvey({
      components: [
        {
          key: "name",
          type: "textfield",
          label: "Full Name",
          placeholder: "Enter name",
          description: "Legal name",
          validate: { required: true },
        },
        { key: "bio", type: "textarea", label: "Biography", rows: 4 },
        { key: "emailAddress", type: "email", label: "Email Address" },
        { key: "age", type: "number", label: "Age" },
        { key: "website", type: "url", label: "Website" },
        { key: "pw", type: "password", label: "Password" },
        { key: "phone", type: "phoneNumber", label: "Phone Number" },
        { key: "dateTime", type: "datetime", label: "Date Time" },
        { key: "startDay", type: "day", label: "Start Day" },
        { key: "timeSlot", type: "time", label: "Time Slot", disabled: true },
      ],
    });

    expect(screen.getByPlaceholderText("Enter name")).toBeTruthy();
    expect(screen.getByText("Legal name")).toBeTruthy();
    expect(screen.getByLabelText(/Full Name/)).toBeTruthy();
    expect(screen.getByLabelText("Biography")).toHaveAttribute("rows", "4");
    expect(screen.getByLabelText("Email Address")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Age")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Website")).toHaveAttribute("type", "url");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Phone Number")).toHaveAttribute("type", "tel");
    expect(screen.getByLabelText("Date Time")).toHaveAttribute("type", "datetime-local");
    expect(screen.getByLabelText("Start Day")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("Time Slot")).toBeDisabled();
  });

  it("captures text, textarea, and numeric edits in the submitted visible values", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        { key: "name", type: "textfield", label: "Full Name" },
        { key: "bio", type: "textarea", label: "Biography" },
        { key: "score", type: "number", label: "Score" },
      ],
    });

    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "Jane Doe" },
    });
    fireEvent.change(screen.getByLabelText("Biography"), {
      target: { value: "A thoughtful candidate" },
    });
    fireEvent.change(screen.getByLabelText("Score"), {
      target: { value: "42" },
    });
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: "Jane Doe",
        bio: "A thoughtful candidate",
        score: 42,
      });
    });
  });

  it("submits an empty string for cleared numeric input", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [{ key: "score", type: "number", label: "Score" }],
      values: { score: 7 },
    });

    fireEvent.change(screen.getByLabelText("Score"), {
      target: { value: "" },
    });
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ score: "" });
    });
  });

  it("handles checkbox, selectboxes, radio, and select controls", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        { key: "agree", type: "checkbox", label: "Agree to terms" },
        {
          key: "hobbies",
          type: "selectboxes",
          label: "Hobbies",
          values: [
            { label: "Reading", value: "read" },
            { label: "Gaming", value: "game" },
          ],
        },
        {
          key: "gender",
          type: "radio",
          label: "Gender",
          values: [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
          ],
        },
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
      values: { hobbies: { read: true }, gender: "male", country: "us" },
    });

    fireEvent.click(screen.getByLabelText("Agree to terms"));
    fireEvent.click(screen.getByLabelText("Gaming"));
    fireEvent.click(screen.getByLabelText("Female"));
    fireEvent.change(screen.getByTestId("mock-select"), { target: { value: "ca" } });
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        agree: true,
        hobbies: { read: true, game: true },
        gender: "female",
        country: "ca",
      });
    });
  });

  it("reads select options from data.json, data.custom, and fallback values", () => {
    renderSurvey({
      components: [
        {
          key: "fromJson",
          type: "select",
          label: "From JSON",
          data: { json: [{ value: "json", label: "JSON Option" }] },
        },
        {
          key: "fromCustom",
          type: "radio",
          label: "From Custom",
          data: { custom: [{ value: true }] },
        },
        {
          key: "fromValues",
          type: "selectboxes",
          label: "From Values",
          values: [{ value: 10 }],
        },
      ],
    });

    expect(screen.getByText("JSON Option")).toBeTruthy();
    expect(screen.getByLabelText("true")).toBeTruthy();
    expect(screen.getByLabelText("10")).toBeTruthy();
  });

  it("renders nested columns and container components and includes hidden row values on submit", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        {
          type: "columns",
          columns: [
            { components: [{ key: "col1", type: "textfield", label: "Col 1" }] },
            { components: [{ key: "col2", type: "textfield", label: "Col 2" }] },
          ],
        },
        {
          type: "rows",
          rows: [[{ components: [{ key: "row1", type: "textfield", label: "Row 1" }] }]],
        },
        {
          type: "container",
          label: "Generic Container",
          components: [{ key: "cont1", type: "textfield", label: "Cont 1" }],
        },
      ],
      values: { row1: "row value" },
    });

    expect(screen.getByLabelText("Col 1")).toBeTruthy();
    expect(screen.getByLabelText("Col 2")).toBeTruthy();
    expect(screen.queryByLabelText("Row 1")).toBeNull();
    expect(screen.getByText("Generic Container")).toBeTruthy();
    expect(screen.getByLabelText("Cont 1")).toBeTruthy();

    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        col1: "",
        col2: "",
        row1: "row value",
        cont1: "",
      });
    });
  });

  it("skips buttons, hidden fields, input:false fields, unsupported fields, and components without keys", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        { key: "buttonField", type: "button", label: "Button Field" },
        { key: "hiddenField", type: "textfield", label: "Hidden Field", hidden: true },
        { key: "displayOnly", type: "textfield", label: "Display Only", input: false },
        { key: "fileUpload", type: "file", label: "File Upload" },
        { type: "textfield", label: "No Key" },
        { key: "visibleField", type: "textfield", label: "Visible Field" },
      ],
    });

    expect(screen.queryByLabelText("Button Field")).toBeNull();
    expect(screen.queryByLabelText("Hidden Field")).toBeNull();
    expect(screen.queryByLabelText("Display Only")).toBeNull();
    expect(screen.getByLabelText("File Upload")).toBeTruthy();
    expect(screen.queryByLabelText("No Key")).toBeNull();
    expect(screen.getByLabelText("Visible Field")).toBeTruthy();

    submit();
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ "visible field": "" });
    });
  });

  it("validates required strings, arrays, empty selectboxes, and checkbox booleans", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        { key: "name", type: "textfield", label: "Name", validate: { required: true } },
        {
          key: "choices",
          type: "selectboxes",
          label: "Choices",
          validate: { required: true },
          values: [{ label: "One", value: "one" }],
        },
        { key: "agree", type: "checkbox", label: "Agree", validate: { required: true } },
      ],
      values: { choices: { one: false }, agree: false },
    });

    submit();

    expect(await screen.findByText("Name is required.")).toBeTruthy();
    expect(screen.getByText("Choices is required.")).toBeTruthy();
    expect(screen.queryByText("Agree is required.")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates email, minLength, maxLength, pattern, and invalid pattern fallback", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        { key: "email", type: "email", label: "Email", validate: { customMessage: "Email custom" } },
        { key: "short", type: "textfield", label: "Short", validate: { minLength: 3 } },
        { key: "long", type: "textfield", label: "Long", validate: { maxLength: 5 } },
        {
          key: "pattern",
          type: "textfield",
          label: "Pattern",
          validate: { pattern: "^[A-Z]+$", customMessage: "Uppercase only" },
        },
        {
          key: "badPattern",
          type: "textfield",
          label: "Bad Pattern",
          validate: { pattern: "[" },
        },
      ],
      values: {
        email: "not-email",
        short: "ab",
        long: "abcdef",
        pattern: "lower",
        badPattern: "anything",
      },
    });

    submit();

    expect(await screen.findByText("Email custom")).toBeTruthy();
    expect(screen.getByText("Short must be at least 3 characters.")).toBeTruthy();
    expect(screen.getByText("Long must be 5 characters or fewer.")).toBeTruthy();
    expect(screen.getByText("Uppercase only")).toBeTruthy();
    expect(screen.queryByText("Bad Pattern has an invalid format.")).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates numeric bounds and NaN values", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        { key: "nan", type: "number", label: "NaN Number" },
        { key: "small", type: "number", label: "Small Number", validate: { min: 5 } },
        { key: "large", type: "number", label: "Large Number", validate: { max: 10 } },
      ],
      values: { nan: "not-a-number", small: 4, large: 11 },
    });

    submit();

    expect(await screen.findByText("NaN Number must be a number.")).toBeTruthy();
    expect(screen.getByText("Small Number must be at least 5.")).toBeTruthy();
    expect(screen.getByText("Large Number must be no more than 10.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("validates custom validators, caches snippets, and uses fallback messages", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        {
          key: "customString",
          type: "textfield",
          label: "Custom String",
          validate: { custom: "valid = input === 'ok' ? true : 'must be ok';" },
        },
        {
          key: "customFalse",
          type: "textfield",
          label: "Custom False",
          validate: {
            custom: "valid = input === data.customString;",
            customMessage: "Values must match",
          },
        },
        {
          key: "customThrow",
          type: "textfield",
          label: "Custom Throw",
          validate: {
            custom: "throw new Error('boom');",
            customMessage: "Custom error fallback",
          },
        },
      ],
      values: { customString: "bad", customFalse: "different", customThrow: "x" },
    });

    submit();

    expect(await screen.findByText("must be ok")).toBeTruthy();
    expect(screen.getByText("Values must match")).toBeTruthy();
    expect(screen.getByText("Custom error fallback")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("clears an existing field error after editing that field to a valid value", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        { key: "username", type: "textfield", label: "Username", validate: { required: true } },
      ],
    });

    submit();
    expect(await screen.findByText("Username is required.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Username/), {
      target: { value: "valid_user" },
    });

    await waitFor(() => {
      expect(screen.queryByText("Username is required.")).toBeNull();
    });

    submit();
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ username: "valid_user" });
    });
  });

  it("hides and reveals fields with simple conditional logic through visibility-changing controls", async () => {
    renderSurvey({
      components: [
        {
          key: "answer",
          type: "radio",
          label: "Answer",
          values: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
        {
          key: "details",
          type: "textfield",
          label: "Details",
          conditional: { when: "answer", eq: "yes" },
        },
        {
          key: "hideWhenNo",
          type: "textfield",
          label: "Hide When No",
          conditional: { when: "answer", eq: "no", show: false },
        },
      ],
    });

    expect(screen.queryByLabelText("Details")).toBeNull();
    expect(screen.getByLabelText("Hide When No")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Yes"));
    expect(await screen.findByLabelText("Details")).toBeTruthy();
    expect(screen.getByLabelText("Hide When No")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("No"));
    await waitFor(() => {
      expect(screen.queryByLabelText("Details")).toBeNull();
      expect(screen.queryByLabelText("Hide When No")).toBeNull();
    });
  });

  it("evaluates JSON conditional operators and transformed data paths", async () => {
    renderSurvey({
      components: [
        {
          key: "statusChoice",
          type: "select",
          label: "Status Choice",
          data: {
            values: [
              { label: "Open", value: "open" },
              { label: "Closed", value: "closed" },
            ],
          },
        },
        {
          key: "reviewFlag",
          type: "checkbox",
          label: "Review Flag",
        },
        {
          key: "jsonVisible",
          type: "textfield",
          label: "JSON Visible",
          conditional: {
            json: {
              and: [
                { "===": [{ var: "data.statusChoice" }, "open"] },
                { "!": { "==": [{ var: "data.reviewFlag" }, false] } },
              ],
            },
          },
        },
        {
          key: "jsonFallback",
          type: "textfield",
          label: "JSON Fallback",
          conditional: { json: { unsupported: true } },
        },
      ],
    });

    expect(screen.queryByLabelText("JSON Visible")).toBeNull();
    expect(screen.getByLabelText("JSON Fallback")).toBeTruthy();

    fireEvent.change(screen.getByTestId("mock-select"), {
      target: { value: "open" },
    });
    expect(await screen.findByLabelText("JSON Visible")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Review Flag"));
    expect(await screen.findByLabelText("JSON Visible")).toBeTruthy();
  });

  it("evaluates custom conditionals and defaults to visible when snippets throw", async () => {
    renderSurvey({
      components: [
        {
          key: "toggle",
          type: "checkbox",
          label: "Toggle",
        },
        {
          key: "customVisible",
          type: "textfield",
          label: "Custom Visible",
          customConditional: "show = data.toggle === true;",
        },
        {
          key: "visibleFallback",
          type: "textfield",
          label: "Visible Fallback",
          customConditional: "show = null; visible = false;",
        },
        {
          key: "brokenCondition",
          type: "textfield",
          label: "Broken Condition",
          customConditional: "throw new Error('broken');",
        },
      ],
    });

    expect(screen.queryByLabelText("Custom Visible")).toBeNull();
    expect(screen.queryByLabelText("Visible Fallback")).toBeNull();
    expect(screen.getByLabelText("Broken Condition")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Toggle"));
    expect(await screen.findByLabelText("Custom Visible")).toBeTruthy();
  });

  it("submits only currently visible values and applies default values", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        {
          key: "showExtra",
          type: "checkbox",
          label: "Show Extra",
        },
        {
          key: "defaulted",
          type: "textfield",
          label: "Defaulted",
          defaultValue: "from default",
        },
        {
          key: "extra",
          type: "textfield",
          label: "Extra",
          conditional: { when: "showExtra", eq: true },
        },
      ],
      values: { extra: "should be omitted" },
    });

    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        "show extra": "",
        defaulted: "from default",
      });
    });
  });

  it("normalizes schema keys, conditional keys, and incoming value keys", async () => {
    const { onSubmit, submit } = renderSurvey({
      components: [
        {
          key: "FirstImpression",
          type: "radio",
          label: "First Impression",
          values: [
            { label: "Very Bad", value: "veryBad" },
            { label: "Good", value: "good" },
          ],
        },
        {
          key: "PleaseElaborate",
          type: "textarea",
          label: "Please Elaborate",
          conditional: { when: "FirstImpression", eq: "veryBad" },
        },
      ],
      values: {
        FirstImpression: "veryBad",
        PleaseElaborate: "Details here",
      },
    });

    expect(screen.getByLabelText("Please Elaborate")).toHaveValue("Details here");
    submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        "first impression": "veryBad",
        "please elaborate": "Details here",
      });
    });
  });

  it("submits asynchronously and disables the submit button while isSubmitting is true", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderSurvey({
      components: [{ key: "name", type: "textfield", label: "Name" }],
      values: { name: "Asha" },
      onSubmit,
      isSubmitting: true,
    });

    const submitButton = screen.getByRole("button", { name: /submitting/i });
    expect(submitButton).toBeDisabled();
  });
});
