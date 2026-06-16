import { evaluateDependsOn } from "@/lib/onboarding-utils";
import { OnboardingTab } from "@/lib/types/onboarding";

type OnboardingFormValues = Record<string, unknown>;

export interface ValidationError {
  type: string;
  message: string;
}

export type ValidationErrors = Record<string, ValidationError | Record<string, unknown> | Array<Record<string, unknown>>>;

function isFilled(value: unknown) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function getSelectOptions(options?: string) {
  return (options || "")
    .split("\n")
    .map((option) => option.trim())
    .filter(Boolean);
}

function setNestedTableError(
  errors: ValidationErrors,
  tableFieldname: string,
  rowIndex: number,
  childFieldname: string,
  error: ValidationError,
) {
  const tableErrors = Array.isArray(errors[tableFieldname])
    ? errors[tableFieldname] as Array<Record<string, unknown>>
    : [];

  tableErrors[rowIndex] = {
    ...(tableErrors[rowIndex] || {}),
    [childFieldname]: error,
  };

  errors[tableFieldname] = tableErrors;
}

function setTableRootError(
  errors: ValidationErrors,
  tableFieldname: string,
  error: ValidationError,
) {
  const currentError = errors[tableFieldname];

  if (Array.isArray(currentError)) {
    const tableErrors = currentError as Array<Record<string, unknown>> & ValidationError & { root?: ValidationError };
    tableErrors.root = error;
    tableErrors.type = error.type;
    tableErrors.message = error.message;
    return;
  }

  errors[tableFieldname] = error;
}

export function validateOnboardingStep(
  tab: OnboardingTab,
  values: OnboardingFormValues,
  stepData: Record<string, Record<string, unknown>>
): ValidationErrors {
  const errorList: ValidationErrors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  // Build doc object for evaluating depends_on in validation
  const doc: Record<string, any> = {};
  Object.keys(stepData).forEach((key) => {
    Object.assign(doc, stepData[key]);
  });
  Object.assign(doc, values);

  tab.sections.forEach((section) => {
    section.fields.forEach((field) => {
      const isFieldVisible = !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
      if (!isFieldVisible) {
        return;
      }

      const fieldValue = values[field.fieldname];
      const normalizedValue =
        typeof fieldValue === "string" ? fieldValue.trim() : fieldValue;
      const isEmailField =
        field.fieldtype.toLowerCase() === "email" ||
        field.label.toLowerCase().includes("email") ||
        field.fieldname.toLowerCase().includes("email");
      const isPhoneField =
        field.label.toLowerCase().includes("mobile") ||
        field.label.toLowerCase().includes("contact number") ||
        field.label.toLowerCase().includes("contact no") ||
        field.label.toLowerCase().includes("phone") ||
        field.fieldname.toLowerCase().includes("mobile") ||
        field.fieldname.toLowerCase().includes("phone") ||
        field.fieldname.toLowerCase().includes("contact_no") ||
        field.fieldname.toLowerCase().includes("contactnumber");

      const isTable = field.fieldtype === "Table";
      const isMandatory =
        field.is_mandatory ||
        field.reqd ||
        (field.mandatory_depends_on && evaluateDependsOn(field.mandatory_depends_on, doc));

      if (isTable) {
        const rows = Array.isArray(normalizedValue) ? (normalizedValue as Record<string, unknown>[]) : [];
        const visibleChildFieldsForRow = (row: Record<string, unknown>) => {
          return field.child_fields?.filter((childField) => {
            return !childField.hidden &&
              (!childField.depends_on || evaluateDependsOn(childField.depends_on, row));
          }) || [];
        };

        const mandatoryChildFieldsForRow = (row: Record<string, unknown>) => {
          return visibleChildFieldsForRow(row).filter((childField) => {
            return childField.is_mandatory ||
              childField.reqd ||
              (childField.mandatory_depends_on && evaluateDependsOn(childField.mandatory_depends_on, row));
          });
        };

        const isRowEmpty = (row: Record<string, unknown>) => {
          return !visibleChildFieldsForRow(row).some(cf => {
            const val = row[cf.fieldname];
            return isFilled(val);
          });
        };

        const nonEmptyRows = rows.filter(row => !isRowEmpty(row));
        const rowsToValidate = rows.filter((row) => {
          return !isRowEmpty(row) || mandatoryChildFieldsForRow(row).length > 0;
        });

        rowsToValidate.forEach((row) => {
          const originalIndex = rows.indexOf(row);
          mandatoryChildFieldsForRow(row).forEach((childField) => {
            if (!isFilled(row[childField.fieldname])) {
              setNestedTableError(errorList, field.fieldname, originalIndex, childField.fieldname, {
                type: "required",
                message: `${childField.label || "This field"} is required`,
              });
            }
          });
        });

        if (isMandatory && nonEmptyRows.length === 0) {
          setTableRootError(errorList, field.fieldname, {
            type: "required",
            message: `${field.label || "This field"} is required`,
          });
        } else if (rowsToValidate.length > 0 && errorList[field.fieldname]) {
          setTableRootError(errorList, field.fieldname, {
            type: "required",
            message: `Please complete all required fields in ${field.label}`,
          });
        }

        // Validate that year of passing does not decrease as education level progresses
        if (field.fieldname === "custom_education_details" && nonEmptyRows.length > 0) {
          const EDUCATION_LEVEL_ORDER: Record<string, number> = {
            "10th": 1,
            "12th": 2,
            "Graduation": 3,
            "Post Graduation": 4,
          };
          const eduRows = nonEmptyRows
            .map(row => {
              const level = String(row["education_level"] || "").trim();
              const yearStr = String(row["year_of_passing"] || "").trim();
              const rank = EDUCATION_LEVEL_ORDER[level];
              const year = parseInt(yearStr, 10);
              return { level, rank, year };
            })
            .filter(item => item.rank !== undefined && !isNaN(item.year));

          eduRows.sort((a, b) => a.rank - b.rank);

          for (let i = 0; i < eduRows.length - 1; i++) {
            const current = eduRows[i];
            const next = eduRows[i + 1];
            if (current.year >= next.year) {
              setTableRootError(errorList, field.fieldname, {
                type: "validate",
                message: `Year of passing for ${next.level} must be after ${current.level} (${current.year})`,
              });
              break;
            }
          }
        }

        // Validate that every nomination category is filled and totals exactly 100%.
        if (field.fieldname === "custom_nomination_details") {
          const nominationTypeOptions = getSelectOptions(
            field.child_fields?.find(
              (childField) => childField.fieldname === "nomination_type",
            )?.options,
          );
          const typeTotals: Record<string, number> = {};
          
          nonEmptyRows.forEach(row => {
            const type = String(row["nomination_type"] || "").trim();
            const percentStr = String(row["percentage"] || "").trim();
            const percent = parseFloat(percentStr);
            if (type && !isNaN(percent)) {
              typeTotals[type] = (typeTotals[type] || 0) + percent;
            }
          });

          const missingTypes = nominationTypeOptions.filter(
            (type) => typeTotals[type] === undefined,
          );

          if (missingTypes.length > 0) {
            setTableRootError(errorList, field.fieldname, {
              type: "required",
              message: `Please add nomination details for: ${missingTypes.join(", ")}`,
            });
            return;
          }

          for (const [type, total] of Object.entries(typeTotals)) {
            if (Math.abs(total - 100) > 0.001) {
              setTableRootError(errorList, field.fieldname, {
                type: "validate",
                message: `Total percentage for ${type} nomination must be exactly 100% (currently ${total}%)`,
              });
              break;
            }
          }
        }
      } else if (isMandatory) {
        const isCheck = field.fieldtype === "Check";

        if (isCheck) {
          if (!Boolean(normalizedValue)) {
            errorList[field.fieldname] = {
              type: "required",
              message: `${field.label || "This field"} is required`,
            };
          }
        } else {
          if (
            normalizedValue === undefined ||
            normalizedValue === null ||
            normalizedValue === ""
          ) {
            errorList[field.fieldname] = {
              type: "required",
              message: `${field.label || "This field"} is required`,
            };
            return;
          }
        }
      }

      if (
        isEmailField &&
        typeof normalizedValue === "string" &&
        normalizedValue !== "" &&
        !emailRegex.test(normalizedValue)
      ) {
        errorList[field.fieldname] = {
          type: "pattern",
          message: "Please enter a valid email address",
        };
      }

      if (
        isPhoneField &&
        typeof normalizedValue === "string" &&
        normalizedValue !== "" &&
        !phoneRegex.test(normalizedValue)
      ) {
        errorList[field.fieldname] = {
          type: "pattern",
          message: "Please enter a valid 10-digit mobile number",
        };
      }

      if (
        field.fieldname === "custom_emergency_contact_number" &&
        typeof normalizedValue === "string" &&
        normalizedValue !== ""
      ) {
        const mobileNumber = doc["custom_mobile_number"];
        const normalizedMobile = typeof mobileNumber === "string" ? mobileNumber.trim() : mobileNumber;
        if (normalizedMobile && normalizedValue === normalizedMobile) {
          errorList[field.fieldname] = {
            type: "validate",
            message: "Emergency contact number cannot be the same as mobile number",
          };
        }
      }

      if (
        field.fieldname === "custom_mobile_number" &&
        typeof normalizedValue === "string" &&
        normalizedValue !== ""
      ) {
        const emergencyContactNumber = doc["custom_emergency_contact_number"];
        const normalizedEmergency = typeof emergencyContactNumber === "string" ? emergencyContactNumber.trim() : emergencyContactNumber;
        if (normalizedEmergency && normalizedValue === normalizedEmergency) {
          errorList[field.fieldname] = {
            type: "validate",
            message: "Mobile number cannot be the same as emergency contact number",
          };
        }
      }

      if (
        field.fieldname === "custom_aadhaar_number" &&
        typeof normalizedValue === "string" &&
        normalizedValue !== ""
      ) {
        const aadhaarRegex = /^\d{12}$/;
        if (!aadhaarRegex.test(normalizedValue)) {
          errorList[field.fieldname] = {
            type: "pattern",
            message: "Please enter a valid 12-digit Aadhaar number",
          };
        }
      }

      if (
        field.fieldname === "custom_pan_number" &&
        typeof normalizedValue === "string" &&
        normalizedValue !== ""
      ) {
        const panRegex = /^[A-Za-z]{5}\d{4}[A-Za-z]{1}$/;
        if (!panRegex.test(normalizedValue)) {
          errorList[field.fieldname] = {
            type: "pattern",
            message: "Please enter a valid 10-character PAN number (e.g. AAAAA1111A)",
          };
        }
      }

      if (
        field.fieldname === "custom_permanent_postal_code" &&
        typeof normalizedValue === "string" &&
        normalizedValue !== ""
      ) {
        const postalCodeRegex = /^[1-9]\d{5}$/;
        if (!postalCodeRegex.test(normalizedValue)) {
          errorList[field.fieldname] = {
            type: "pattern",
            message: "Please enter a valid 6-digit postal code (cannot start with 0)",
          };
        }
      }

      if (
        field.fieldname === "custom_ifsc_code" &&
        typeof normalizedValue === "string" &&
        normalizedValue !== ""
      ) {
        const ifscRegex = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
        if (!ifscRegex.test(normalizedValue)) {
          errorList[field.fieldname] = {
            type: "pattern",
            message: "Please enter a valid 11-character IFSC code (e.g. SBIN0123456)",
          };
        }
      }

      if (
        field.fieldname === "custom_date_of_birth" &&
        typeof normalizedValue === "string" &&
        normalizedValue !== ""
      ) {
        const birthDate = new Date(normalizedValue);
        const today = new Date();
        const ageLimitDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        if (birthDate > ageLimitDate) {
          errorList[field.fieldname] = {
            type: "validate",
            message: "You must be at least 18 years old",
          };
        }
      }
    });
  });

  return errorList;
}
