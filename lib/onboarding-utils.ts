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
