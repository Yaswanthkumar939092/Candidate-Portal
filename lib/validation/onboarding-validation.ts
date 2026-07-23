import { evaluateDependsOn } from "@/lib/onboarding-utils";
import { OnboardingTab } from "@/lib/types/onboarding";

type OnboardingFormValues = Record<string, unknown>;

export interface ValidationError {
  type: string;
  message: string;
}

export type ValidationErrors = Record<string, ValidationError | Record<string, unknown> | Array<Record<string, unknown>>>;

function validateFieldPattern(
  fieldname: string,
  label: string,
  fieldtype: string,
  value: unknown
): ValidationError | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const normalizedValue = typeof value === "string" ? value.trim() : String(value).trim();
  if (normalizedValue === "") {
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;

  const labelLower = (label || "").toLowerCase();
  const nameLower = (fieldname || "").toLowerCase();

  const isEmailField =
    (fieldtype || "").toLowerCase() === "email" ||
    labelLower.includes("email") ||
    nameLower.includes("email");

  const isPhoneField =
    labelLower.includes("mobile") ||
    labelLower.includes("contact number") ||
    labelLower.includes("contact no") ||
    labelLower.includes("phone") ||
    nameLower.includes("mobile") ||
    nameLower.includes("phone") ||
    nameLower.includes("contact_no") ||
    nameLower.includes("contactnumber") ||
    nameLower.includes("contact_number");

  if (isEmailField && !emailRegex.test(normalizedValue)) {
    return {
      type: "pattern",
      message: "Please enter a valid email address",
    };
  }

  if (isPhoneField && !phoneRegex.test(normalizedValue)) {
    return {
      type: "pattern",
      message: "Please enter a valid 10-digit mobile number",
    };
  }

  if (fieldname === "custom_aadhaar_number" && !/^\d{12}$/.test(normalizedValue)) {
    return {
      type: "pattern",
      message: "Please enter a valid 12-digit Aadhaar number",
    };
  }

  if (fieldname === "custom_pan_number" && !/^[A-Za-z]{5}\d{4}[A-Za-z]{1}$/.test(normalizedValue)) {
    return {
      type: "pattern",
      message: "Please enter a valid 10-character PAN number (e.g. AAAAA1111A)",
    };
  }

  if (fieldname === "custom_permanent_postal_code" && !/^[1-9]\d{5}$/.test(normalizedValue)) {
    return {
      type: "pattern",
      message: "Please enter a valid 6-digit postal code (cannot start with 0)",
    };
  }

  if (fieldname === "custom_ifsc_code" && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(normalizedValue)) {
    return {
      type: "pattern",
      message: "Please enter a valid 11-character IFSC code (e.g. BBBB0AAAAAA)",
    };
  }

  if ((fieldname === "custom_date_of_birth" || fieldname === "dob") && normalizedValue !== "") {
    const birthDate = new Date(normalizedValue);
    const today = new Date();
    const ageLimitDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    if (birthDate > ageLimitDate) {
      return {
        type: "validate",
        message: "You must be at least 18 years old",
      };
    }
  }

  const isNumberField =
    fieldtype === "Int" ||
    fieldtype === "Float" ||
    fieldtype === "Currency" ||
    fieldtype === "Percent";

  if (isNumberField) {
    const numVal = Number(normalizedValue);
    if (!isNaN(numVal) && numVal < 0) {
      return {
        type: "validate",
        message: `${label || "This field"} cannot be negative`,
      };
    }
  }

  const isPercent =
    nameLower.includes("percentage") ||
    labelLower.includes("percentage") ||
    (fieldtype || "").toLowerCase() === "percent";

  if (isPercent) {
    const numVal = Number(normalizedValue);
    if (!isNaN(numVal) && numVal > 100) {
      return {
        type: "validate",
        message: `${label || "Percentage"} cannot be greater than 100`,
      };
    }
  }

  return null;
}

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

const REQUIRED_EDUCATION_LEVELS = ["10th", "12th", "Graduation"];
const POST_GRADUATION_LEVEL = "Post Graduation";

function isYes(value: unknown) {
  return String(value ?? "").trim().toLowerCase() === "yes";
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

  const IS_FRESHER_FIELDNAME = "is_fresher";
  const EMPLOYMENT_TABLE_FIELDNAME = "custom_jf_employment";

  tab.sections.forEach((section) => {
    section.fields.forEach((field) => {
      // Skip employment table entirely when is_fresher is checked
      if (field.fieldname === EMPLOYMENT_TABLE_FIELDNAME && doc[IS_FRESHER_FIELDNAME]) {
        return;
      }

      const isFieldVisible = !field.hidden && (!field.depends_on || evaluateDependsOn(field.depends_on, doc));
      if (!isFieldVisible) {
        return;
      }

      // When is_fresher is NOT checked, enrich employment table to be mandatory
      const effectiveField = (field.fieldname === EMPLOYMENT_TABLE_FIELDNAME && !doc[IS_FRESHER_FIELDNAME])
        ? {
            ...field,
            is_mandatory: 1,
            child_fields: field.child_fields?.map((cf) => ({
              ...cf,
              is_mandatory: 1,
            })),
          }
        : field;

      const fieldValue = values[effectiveField.fieldname];
      const normalizedValue =
        typeof fieldValue === "string" ? fieldValue.trim() : fieldValue;
      const isEmailField =
        effectiveField.fieldtype.toLowerCase() === "email" ||
        effectiveField.label.toLowerCase().includes("email") ||
        effectiveField.fieldname.toLowerCase().includes("email");
      const isPhoneField =
        effectiveField.label.toLowerCase().includes("mobile") ||
        effectiveField.label.toLowerCase().includes("contact number") ||
        effectiveField.label.toLowerCase().includes("contact no") ||
        effectiveField.label.toLowerCase().includes("phone") ||
        effectiveField.fieldname.toLowerCase().includes("mobile") ||
        effectiveField.fieldname.toLowerCase().includes("phone") ||
        effectiveField.fieldname.toLowerCase().includes("contact_no") ||
        effectiveField.fieldname.toLowerCase().includes("contactnumber") ||
        effectiveField.fieldname.toLowerCase().includes("contact_number");

      const isTable = effectiveField.fieldtype === "Table";
      const isMandatory =
        effectiveField.is_mandatory ||
        effectiveField.reqd ||
        (effectiveField.mandatory_depends_on && evaluateDependsOn(effectiveField.mandatory_depends_on, doc));

      if (isTable) {
        const rows = Array.isArray(normalizedValue) ? (normalizedValue as Record<string, unknown>[]) : [];
        const visibleChildFieldsForRow = (row: Record<string, unknown>) => {
          return effectiveField.child_fields?.filter((childField) => {
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
              setNestedTableError(errorList, effectiveField.fieldname, originalIndex, childField.fieldname, {
                type: "required",
                message: `${childField.label || "This field"} is required`,
              });
            }
          });

          visibleChildFieldsForRow(row).forEach((childField) => {
            const val = row[childField.fieldname];
            if (isFilled(val)) {
              const patternError = validateFieldPattern(
                childField.fieldname,
                childField.label || "",
                childField.fieldtype || "Data",
                val
              );
              if (patternError) {
                setNestedTableError(errorList, effectiveField.fieldname, originalIndex, childField.fieldname, patternError);
              }
            }
          });
        });

        if (isMandatory && nonEmptyRows.length === 0) {
          setTableRootError(errorList, effectiveField.fieldname, {
            type: "required",
            message: `${effectiveField.label || "This field"} is required`,
          });
        } else if (rowsToValidate.length > 0 && errorList[effectiveField.fieldname]) {
          setTableRootError(errorList, effectiveField.fieldname, {
            type: "required",
            message: `Please complete all required fields in ${effectiveField.label}`,
          });
        }

        if (effectiveField.fieldname === "custom_education_details") {
          const EDUCATION_LEVEL_ORDER: Record<string, number> = {
            "10th": 1,
            "12th": 2,
            "Graduation": 3,
            "Post Graduation": 4,
          };
          const submittedEducationLevels = new Set(
            nonEmptyRows
              .map((row) => String(row["education_level"] || "").trim())
              .filter(Boolean),
          );
          const requiredEducationLevels = [
            ...REQUIRED_EDUCATION_LEVELS,
            ...(isYes(doc["custom_has_post_graduation_degree"])
              ? [POST_GRADUATION_LEVEL]
              : []),
          ];
          const missingEducationLevels = requiredEducationLevels.filter(
            (level) => !submittedEducationLevels.has(level),
          );

          if (missingEducationLevels.length > 0) {
            setTableRootError(errorList, effectiveField.fieldname, {
              type: "required",
              message: `Please add education details for: ${missingEducationLevels.join(", ")}`,
            });
          }

          if (nonEmptyRows.length > 0) {
            // Validate that year of passing does not decrease as education level progresses
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
                setTableRootError(errorList, effectiveField.fieldname, {
                  type: "validate",
                  message: `Year of passing for ${next.level} must be after ${current.level} (${current.year})`,
                });
                break;
              }
            }
          }
        }

        // Validate that every nomination category is filled and totals exactly 100%.
        if (effectiveField.fieldname === "custom_nomination_details") {
          const nominationTypeOptions = getSelectOptions(
            effectiveField.child_fields?.find(
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
            setTableRootError(errorList, effectiveField.fieldname, {
              type: "required",
              message: `Please add nomination details for: ${missingTypes.join(", ")}`,
            });
            return;
          }

          for (const [type, total] of Object.entries(typeTotals)) {
            if (Math.abs(total - 100) > 0.001) {
              setTableRootError(errorList, effectiveField.fieldname, {
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
        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(normalizedValue)) {
          errorList[field.fieldname] = {
            type: "pattern",
            message: "Please enter a valid 11-character IFSC code (e.g. BBBB0AAAAAA)",
          };
        }
      }

      if (
        (field.fieldname === "custom_date_of_birth" || field.fieldname === "dob") &&
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

      // Run generic pattern and type validation
      const patternError = validateFieldPattern(
        field.fieldname,
        field.label || "",
        field.fieldtype || "Data",
        normalizedValue
      );
      if (patternError) {
        errorList[field.fieldname] = patternError;
      }
    });
  });

  return errorList;
}
