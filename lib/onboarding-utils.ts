import { OnboardingField } from "./types/onboarding";

/**
 * Evaluates a depends_on expression (e.g. "eval:doc.custom_has_passport=='Yes'")
 * using the provided document (doc) state.
 */
export function evaluateDependsOn(expression: string | undefined, doc: Record<string, any>): boolean {
  if (!expression) return true;

  let jsExpr = expression.trim();
  if (jsExpr.startsWith("eval:")) {
    jsExpr = jsExpr.substring(5).trim();
  }

  if (!jsExpr) return true;

  // Check if expression is a simple fieldname (e.g. "custom_is_rehire")
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(jsExpr)) {
    return Boolean(doc[jsExpr]);
  }

  // Check if expression is a simple negated fieldname (e.g. "!custom_is_rehire")
  if (/^![a-zA-Z_][a-zA-Z0-9_]*$/.test(jsExpr)) {
    const fieldName = jsExpr.substring(1);
    return !doc[fieldName];
  }

  try {
    // Evaluate the expression with doc as the parameter.
    const fn = new Function("doc", `
      try {
        return Boolean(${jsExpr});
      } catch (e) {
        return false;
      }
    `);
    return fn(doc);
  } catch (error) {
    console.error("Error creating/evaluating depends_on function:", expression, error);
    return false;
  }
}

export function isFieldFilled(field: OnboardingField, doc: Record<string, any>): boolean {
  const val = doc[field.fieldname];

  if (field.fieldtype === "Table") {
    if (!Array.isArray(val) || val.length === 0) return false;
    
    const visibleChildFields = field.child_fields?.filter((f) => !f.hidden) || [];

    const isRowEmpty = (row: Record<string, any>) => {
      return !visibleChildFields.some((cf) => {
        const rowVal = row[cf.fieldname];
        return rowVal !== undefined && rowVal !== null && String(rowVal).trim() !== "";
      });
    };

    const isRowValid = (row: Record<string, any>) => {
      const mandatoryChildFields = visibleChildFields.filter(
        (f) => f.is_mandatory || f.reqd || (f.mandatory_depends_on && evaluateDependsOn(f.mandatory_depends_on, row))
      );
      
      return mandatoryChildFields.every((cf) => {
        const rowVal = row[cf.fieldname];
        return rowVal !== undefined && rowVal !== null && String(rowVal).trim() !== "";
      });
    };

    const nonEmptyRows = val.filter((row) => !isRowEmpty(row));
    if (nonEmptyRows.length === 0) return false;
    return nonEmptyRows.every(isRowValid);
  }

  if (field.fieldtype === "Check") {
    return Boolean(val);
  }

  return val !== undefined && val !== null && String(val).trim() !== "";
}
