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
