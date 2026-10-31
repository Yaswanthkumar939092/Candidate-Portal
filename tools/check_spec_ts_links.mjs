#!/usr/bin/env node
// Two-way link checker for Vitest tests named by spec cases.
//
// check_spec_cases.py and check_spec_test_links.py accept Python selectors only
// (docs/spec/checkers.md "Limits"). This repo's tests are TypeScript, so this
// script does for them what check_spec_test_links.py does for Python: it reads
// files only, never runs a test and never imports the code under test.
//
// Selector form (docs/spec/acceptance-cases.md section 5):
//   Test: <mapped|characterization>: `path/file.test.ts(x)::exact test title`
// The title is the first argument of one `it("...")` / `test("...")` call, written
// as a single-line quoted string (double or single quotes, or a backtick string without interpolation), and unique inside its file.
//
// Usage (repo root):
//   node tools/check_spec_ts_links.mjs                 check, exit 0 / 1 / 2
//   node tools/check_spec_ts_links.mjs --traceability  print the case rows for test-traceability.md
//   node tools/check_spec_ts_links.mjs --root DIR --spec-dir docs/spec
//
// Exit 0: no findings. 1: findings. 2: usage error. Node 18 or later, no packages.

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : dflt;
};
const ROOT = path.resolve(opt("--root", "."));
const SPEC_DIR = opt("--spec-dir", "docs/spec");
const WANT_TRACE = args.includes("--traceability");
const CLAUSES = path.join(ROOT, SPEC_DIR, "clauses");
const ENV_LINE = "no-site: vitest, jsdom; backend stubbed; no database";
const CHAR_LINE = "Characterization: pins current behaviour, not endorsed.";

if (!fs.existsSync(CLAUSES)) {
  console.error(`check_spec_ts_links.mjs: error: clauses directory not found: ${CLAUSES}`);
  process.exit(2);
}

const findings = [];
const add = (file, line, rule, msg) => findings.push({ file, line, rule, msg });
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

// ---------------------------------------------------------------------------
// Clause parsing: only what the TS link needs (case id, Test field, index row).
// ---------------------------------------------------------------------------
const cases = [];
for (const name of fs.readdirSync(CLAUSES).filter((f) => f.endsWith(".md")).sort()) {
  const file = path.join(CLAUSES, name);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  let cur = null;
  const rows = new Map();
  lines.forEach((text, i) => {
    const h = /^#### (\S+): (.+)$/.exec(text);
    if (h) {
      cur = { id: h[1], title: h[2], clause: name, file: rel(file), line: i + 1, test: null };
      cases.push(cur);
      return;
    }
    if (/^#{1,3} /.test(text)) cur = null;
    const e = /^- Environment: (.*)$/.exec(text);
    if (e && cur && e[1] !== ENV_LINE) add(rel(file), i + 1, "environment", `case ${cur.id}: Environment must be '${ENV_LINE}'`);
    const t = /^- Test: (mapped|characterization): `([^`]*)`$/.exec(text);
    if (t && cur) {
      const [p, title, ...extra] = t[2].split("::");
      cur.test = { kind: t[1], path: p, title, extra, line: i + 1 };
    }
    const r = /^\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|(.*)\|\s*\[`([^`]+)`\]\(([^)]+)\)\s*\|\s*$/.exec(text);
    if (r) rows.set(r[1], { line: i + 1, href: r[2], label: r[4], thref: r[5], mid: r[3].trim() });
  });
  for (const c of cases.filter((x) => x.clause === name)) c.row = rows.get(c.id) ?? null;
}

// ---------------------------------------------------------------------------
// Test file parsing.
// ---------------------------------------------------------------------------
const fileCache = new Map();
function loadTestFile(relPath) {
  if (fileCache.has(relPath)) return fileCache.get(relPath);
  const abs = path.join(ROOT, relPath);
  let res = null;
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
    const text = fs.readFileSync(abs, "utf8");
    res = { text, lines: text.split("\n"), calls: findCalls(text) };
  }
  fileCache.set(relPath, res);
  return res;
}

// Find every it(...) / test(...) call with its title and body span.
function findCalls(text) {
  const calls = [];
  const re = /\b(it|test)(\.(?:skip|todo|only|fails|concurrent|each))*\s*\(\s*(["'`])((?:\\.|(?!\3)[^\\])*)\3/g;
  let m;
  while ((m = re.exec(text))) {
    const start = m.index;
    // Skip hits that are inside a string or a comment line.
    const lineStart = text.lastIndexOf("\n", start) + 1;
    const before = text.slice(lineStart, start);
    if (/^\s*(\/\/|\*)/.test(before)) continue;
    const modifiers = (m[0].match(/\.(skip|todo|only|fails|concurrent|each)/g) || []).join("");
    const open = text.indexOf("(", start);
    const end = matchParen(text, open);
    calls.push({
      title: m[4],
      quote: m[3],
      modifiers,
      start,
      end,
      line: text.slice(0, start).split("\n").length,
      body: text.slice(open, end + 1),
    });
  }
  return calls;
}

function matchParen(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < text.length && text[i] !== q) {
        if (text[i] === "\\") i++;
        i++;
      }
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      i = text.indexOf("*/", i + 2);
      if (i < 0) return text.length - 1;
      i++;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return text.length - 1;
}

// Comment lines directly above a call (no blank line between).
function commentBlock(file, call) {
  const out = [];
  let i = call.line - 2; // zero-based index of the previous line
  while (i >= 0 && /^\s*\/\//.test(file.lines[i])) {
    out.unshift({ text: file.lines[i].trim(), line: i + 1 });
    i--;
  }
  return out;
}

const SPEC_RE = /^\/\/ Spec: (\S+) \(([^)]*)\)$/;
const hasAssertion = (body) => /\bexpect\s*\(|\bexpect\.[a-zA-Z]+\s*\(|\bassert[A-Za-z]*\s*\(/.test(body);

// ---------------------------------------------------------------------------
// Spec -> test
// ---------------------------------------------------------------------------
const byTest = new Map(); // `${path}::${title}` -> [case]
for (const c of cases) {
  if (!c.test) {
    add(c.file, c.line, "test-field", `case ${c.id}: Test field is missing or not '<mapped|characterization>: \`path.test.ts::title\`'`);
    continue;
  }
  const { kind, path: p, title, extra, line } = c.test;
  if (extra.length) add(c.file, line, "test-field", `case ${c.id}: selector must be path::title with no further '::'`);
  if (!/^(src|tests?)\/[A-Za-z0-9_./()-]+\.test\.tsx?$/.test(p) || p.includes("..")) {
    add(c.file, line, "test-field", `case ${c.id}: '${p}' must be a repo-relative *.test.ts or *.test.tsx path`);
    continue;
  }
  if (!title || /[`]/.test(title)) add(c.file, line, "test-field", `case ${c.id}: test title is empty or holds a backtick`);
  const key = `${p}::${title}`;
  byTest.set(key, [...(byTest.get(key) ?? []), c]);

  const file = loadTestFile(p);
  if (!file) {
    add(c.file, line, "test-file", `case ${c.id}: test file '${p}' does not exist`);
    continue;
  }
  const hits = file.calls.filter((x) => x.title === title);
  if (hits.length === 0) {
    add(c.file, line, "test-missing", `case ${c.id}: no it()/test() titled "${title}" in ${p} (titles are one-line quoted strings, exact)`);
    continue;
  }
  if (hits.length > 1) add(c.file, line, "test-duplicate", `case ${c.id}: ${hits.length} tests titled "${title}" in ${p}; titles must be unique`);
  const call = hits[0];
  if (call.quote === "`" && /\$\{/.test(title)) add(p, call.line, "test-title-quote", `title of "${title}" is a template literal with an interpolation; it cannot be named exactly`);
  if (call.modifiers) add(c.file, line, "test-skipped", `case ${c.id}: "${title}" is declared with ${call.modifiers}; a skipped, todo or conditional test is not coverage`);
  if (/\b(skip|skipIf|runIf)\s*\(|\bit\.skip|\bctx\.skip/.test(call.body)) add(c.file, line, "test-skipped", `case ${c.id}: "${title}" skips itself`);
  if (!hasAssertion(call.body)) add(c.file, line, "test-scaffold", `case ${c.id}: "${title}" has no expect() (empty scaffold)`);
  if (/expect\(\s*(true|false|1|0)\s*\)\s*\.\s*(toBe|toEqual)\(\s*(true|false|1|0)\s*\)/.test(call.body) && (call.body.match(/\bexpect\s*\(/g) || []).length === 1)
    add(c.file, line, "test-scaffold", `case ${c.id}: "${title}" asserts only a literal`);

  // test -> spec comment
  const block = commentBlock(file, call);
  const wantRef = `${SPEC_DIR}/clauses/${c.clause}#${c.id.toLowerCase().replace(/\./g, "-")}`;
  const mine = block.filter((b) => { const m = SPEC_RE.exec(b.text); return m && m[1] === c.id; });
  if (mine.length === 0) add(p, call.line, "spec-line-missing", `"${title}" needs the comment line '// Spec: ${c.id} (${wantRef})' directly above it`);
  for (const b of mine) {
    const m = SPEC_RE.exec(b.text);
    if (m[2] !== wantRef) add(p, b.line, "spec-line-ref", `'// Spec: ${c.id}' points to '${m[2]}', expected '${wantRef}'`);
  }
  if (mine.length > 1) add(p, call.line, "spec-line-duplicate", `'// Spec: ${c.id}' appears ${mine.length} times above "${title}"`);
  const hasChar = block.some((b) => b.text === `// ${CHAR_LINE}`);
  if (kind === "characterization" && !hasChar) add(p, call.line, "characterization-line", `"${title}" is a characterization test for ${c.id}; it needs the comment line '// ${CHAR_LINE}'`);

  // Index row
  if (!c.row) add(c.file, c.line, "index-row-missing", `case ${c.id} has no index row '| [ID](clause.md#anchor) | what the assertions check | [\`title\`](path) |'`);
  else {
    if (c.row.href !== `${c.clause}#${c.id.toLowerCase().replace(/\./g, "-")}`) add(c.file, c.row.line, "index-row-link", `case link must be '${c.clause}#${c.id.toLowerCase().replace(/\./g, "-")}', found '${c.row.href}'`);
    if (c.row.label !== title) add(c.file, c.row.line, "index-row-test", `test label must be '${title}', found '${c.row.label}'`);
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(c.file), decodeURIComponent(c.row.thref)));
    if (target !== p) add(c.file, c.row.line, "index-row-test", `test link resolves to '${target}' but the Test field names '${p}'`);
    if (!c.row.mid) add(c.file, c.row.line, "index-row-format", "the middle cell must say what the assertions check");
  }
}

// mapped-only tests must not carry the characterization line
for (const [key, cs] of byTest) {
  if (cs.some((c) => c.test.kind === "characterization")) continue;
  const [p, title] = key.split("::");
  const file = loadTestFile(p);
  const call = file?.calls.find((x) => x.title === title);
  if (call && commentBlock(file, call).some((b) => b.text === `// ${CHAR_LINE}`))
    add(p, call.line, "characterization-line", `"${title}" carries the Characterization line but every case that maps it is 'mapped'`);
}

// ---------------------------------------------------------------------------
// Test -> spec: every '// Spec:' comment in a test file must be backed.
// ---------------------------------------------------------------------------
const idToCase = new Map(cases.map((c) => [c.id, c]));
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || ["node_modules", "dist", "build", "coverage"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.test\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}
for (const abs of walk(ROOT)) {
  const p = rel(abs);
  const file = loadTestFile(p);
  file.lines.forEach((text, i) => {
    if (!/^\s*\/\/ Spec:/.test(text)) return;
    const m = SPEC_RE.exec(text.trim());
    if (!m) { add(p, i + 1, "spec-line-format", "a Spec comment must be exactly '// Spec: <ID> (<path>#<anchor>)'"); return; }
    const c = idToCase.get(m[1]);
    if (!c) { add(p, i + 1, "spec-line-orphan", `'Spec: ${m[1]}' names no case in ${SPEC_DIR}/clauses`); return; }
    // find the call this comment block belongs to
    const call = file.calls.find((x) => x.line > i + 1 && commentBlock(file, x).some((b) => b.line === i + 1));
    if (!call) { add(p, i + 1, "spec-line-misplaced", `'Spec: ${m[1]}' is not in the comment block directly above an it()/test() call`); return; }
    if (!c.test || c.test.path !== p || c.test.title !== call.title)
      add(p, i + 1, "spec-line-mismatch", `'Spec: ${m[1]}' is above "${call.title}", but case ${m[1]} names ${c.test ? `${c.test.path}::${c.test.title}` : "no valid test"}`);
  });
}

// ---------------------------------------------------------------------------
// Citations: every `path:N` or `path:N-M` in a clause must resolve at the
// 'Described at' commit (git show <sha>:<path>), never in the working tree.
// ---------------------------------------------------------------------------
import { execFileSync } from "node:child_process";
const lineCountCache = new Map();
function linesAt(sha, p) {
  const key = `${sha}:${p}`;
  if (!lineCountCache.has(key)) {
    let n = null;
    try {
      n = execFileSync("git", ["-C", ROOT, "show", key], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }).split("\n").length - 1;
    } catch { /* missing */ }
    lineCountCache.set(key, n);
  }
  return lineCountCache.get(key);
}
for (const name of fs.readdirSync(CLAUSES).filter((f) => f.endsWith(".md")).sort()) {
  const file = path.join(CLAUSES, name);
  const text = fs.readFileSync(file, "utf8");
  const sha = (/^- Described at: .*commit `([0-9a-f]{40})`/m.exec(text) || [])[1];
  if (!sha) { add(rel(file), 1, "header-commit", "no 'Described at' commit"); continue; }
  text.split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/`((?:src|app|lib|components|types|tests|scripts|\.github|tools|public|docs)\/[A-Za-z0-9_./\-\[\]()]+|Dockerfile|[A-Za-z0-9_.\-]+\.(?:json|ts|js|cjs|mjs|html|yaml|yml|lock)):(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)`/g)) {
      const n = linesAt(sha, m[1]);
      if (n === null) { add(rel(file), i + 1, "citation-unresolved", `'${m[1]}' does not exist at ${sha.slice(0, 7)}`); continue; }
      for (const r of m[2].split(",")) {
        const [lo, hi] = r.split("-").map(Number);
        if (lo < 1 || (hi && hi < lo) || (hi ?? lo) > n) add(rel(file), i + 1, "citation-range", `'${m[1]}:${r}' is outside the ${n} lines at ${sha.slice(0, 7)}`);
      }
    }
  });
}

// ---------------------------------------------------------------------------
if (WANT_TRACE) {
  for (const c of cases) {
    if (!c.test) continue;
    const clauseId = (/^# (SPEC-[A-Z0-9]+-\d{2}):/m.exec(fs.readFileSync(path.join(CLAUSES, c.clause), "utf8")) || [])[1];
    console.log(`| [${c.id}](clauses/${c.clause}#${c.id.toLowerCase().replace(/\./g, "-")}) | \`${clauseId}\` | ${c.test.kind} | [\`${c.test.title}\`](../../${c.test.path.replace(/\(/g, "%28").replace(/\)/g, "%29")}) | UNVERIFIED |`);
  }
  process.exit(0);
}

findings.sort((a, b) => (a.file + String(a.line).padStart(6, "0") + a.rule).localeCompare(b.file + String(b.line).padStart(6, "0") + b.rule));
for (const f of findings) console.log(`${f.file}:${f.line}: ${f.rule}: ${f.msg}`);
const testFiles = new Set([...byTest.keys()].map((k) => k.split("::")[0]));
console.log(`spec-ts-links: ${cases.length} case(s), ${testFiles.size} test file(s) read, ${byTest.size} linked test(s), ${findings.length} finding(s)`);
process.exit(findings.length ? 1 : 0);
