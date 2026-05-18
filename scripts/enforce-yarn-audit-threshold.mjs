import { spawnSync } from "node:child_process";

const severityOrder = ["info", "low", "moderate", "high", "critical"];
const threshold = process.argv[2] || "high";
const thresholdIndex = severityOrder.indexOf(threshold);

if (thresholdIndex === -1) {
  console.error(`Unsupported audit threshold "${threshold}".`);
  process.exit(2);
}

const result = spawnSync("yarn", ["audit", "--json"], {
  encoding: "utf8",
  shell: false,
});

if (result.error) {
  console.error(`Failed to run yarn audit: ${result.error.message}`);
  process.exit(2);
}

const advisories = [];
let summary = null;

for (const line of result.stdout.split("\n")) {
  if (!line.trim()) continue;
  try {
    const event = JSON.parse(line);
    if (event.type === "auditAdvisory") {
      advisories.push(event.data.advisory);
    }
    if (event.type === "auditSummary") {
      summary = event.data.vulnerabilities;
    }
  } catch {
    // Yarn can emit non-JSON noise on some versions; ignore it.
  }
}

const blockingAdvisories = advisories.filter((advisory) => {
  return severityOrder.indexOf(advisory.severity) >= thresholdIndex;
});

if (summary) {
  console.log(
    `Audit summary: ${summary.info} info, ${summary.low} low, ${summary.moderate} moderate, ${summary.high} high, ${summary.critical} critical.`,
  );
}

if (!summary && result.status !== 0) {
  console.error(result.stderr || "yarn audit failed before returning a summary.");
  process.exit(result.status || 2);
}

if (blockingAdvisories.length) {
  console.error(`Found ${blockingAdvisories.length} ${threshold}+ security advisories:`);
  for (const advisory of blockingAdvisories) {
    console.error(`- [${advisory.severity}] ${advisory.module_name}: ${advisory.title}`);
  }
  process.exit(1);
}

console.log(`No ${threshold}+ security advisories found.`);
