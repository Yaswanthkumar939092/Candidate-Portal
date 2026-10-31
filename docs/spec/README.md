# As-built specifications: Candidate-Portal

This folder holds the **as-built specification** of `hybrowlabs/Candidate-Portal` (Next.js 15 App Router, React 19, TypeScript, Vitest): what the code under `app/`, `lib/` and `components/` does today for routing, the session, the Frappe backend contract and sign-in, with acceptance cases that pin it to Vitest tests. Rules, case schema and checkers were copied from the CN-HRMS-Core pilot (parent PWHR-1270) through the alumni-portal spec (PWHR-1372); see [conventions.md](conventions.md) and [acceptance-cases.md](acceptance-cases.md). Issue: PWHR-1364 (parent PWHR-1362).

Status: DRAFT. Every case is `Evidence: UNVERIFIED` until a receipt for an exact head is recorded. Hosted CI is UNVERIFIED (this change installs no workflow).

## What was read

- Described at: branch `develop`, commit `97dbcd5d3ce79fbc49dc0ba254c7a52375fbd8e5` (committer date `2026-10-30 22:32:12 +0530`). Every `path:line` citation refers to that commit.
- The repo has no `pw-uat` branch (`git ls-remote --heads origin pw-uat` printed nothing on 2026-10-31). `origin/deploy/hybrowbase-candidate-20261025` (`786b53e406869986d5d5d0c81b7ae6b1605f8315`) has 10 commits `develop` lacks and `develop` has 18 it lacks; it deletes the `/backend` route handler, adds a method allowlist in `middleware.ts` and changes the login, register and several server routes. Only `develop` is described. Other unmerged branches were not read. Issue: PWHR-1518.
- Pages and components outside the first three clauses are described by the clauses numbered 04 to 07 (PWHR-1366, below). Still out of scope after those: the jobs, offer, survey, profile, campus-form and token-link pages and their components. The independent review is PWHR-1368.
- Clauses 04 to 07 (PWHR-1366): branch `develop`, commit `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` (committer date `2026-10-31 17:27:47 +0000`). `git diff 97dbcd5 0d7fd6f -- app lib components` is empty, so the citations of clauses 01 to 03 hold at both commits. `git ls-remote --heads origin pw-uat` printed nothing again on 2026-11-01. Each of the four clauses records the deploy-branch differences for the files it cites.
- Test and tool files added by this change are read at the merge head, not at `Described at`: every file under `tests/spec/`, `tests/stubs/server-only.ts`, and the tools under `tools/`. Existing tests that gained a `// Spec:` comment line are read at the merge head.
- Test-environment change: `server-only` is imported by `lib/server/feature-flags.ts` but is not installed as a package, so `vitest.config.ts` gains an alias to `tests/stubs/server-only.ts`.

## Layout

| Path | What it is |
|---|---|
| [`README.md`](README.md) | This file and the clause index. |
| [`conventions.md`](conventions.md), [`acceptance-cases.md`](acceptance-cases.md), [`reviewer-checklist.md`](reviewer-checklist.md), [`ci-spec-check.md`](ci-spec-check.md), [`checkers.md`](checkers.md) | Copied unchanged from the alumni-portal spec (itself from CN-HRMS-Core `docs/spec/`). |
| [`test-traceability.md`](test-traceability.md) | Index only: case to test rows, uncovered behaviour, retired IDs. |
| [`clauses/NN-name.md`](clauses/) | One clause per area. |
| [`adr/`](adr/), [`templates/`](templates/) | Copied unchanged. |

## IDs in this repo

Repo code `CAND`. Clause `SPEC-CAND-NN`; case `CAND-NN-A<k>.<n><L>`.

## Clause index

| ID | Title | Described at |
|---|---|---|
| `SPEC-CAND-01` | [Overview, routes and session](clauses/01-overview-routing-and-session.md) | `develop` `97dbcd5d3ce79fbc49dc0ba254c7a52375fbd8e5` |
| `SPEC-CAND-02` | [Backend contract, proxy and server routes](clauses/02-api-client-and-backend-contract.md) | `develop` `97dbcd5d3ce79fbc49dc0ba254c7a52375fbd8e5` |
| `SPEC-CAND-03` | [Authentication client and sign-in pages](clauses/03-authentication.md) | `develop` `97dbcd5d3ce79fbc49dc0ba254c7a52375fbd8e5` |
| `SPEC-CAND-04` | [Candidate dashboard](clauses/04-dashboard.md) | `develop` `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` |
| `SPEC-CAND-05` | [Onboarding page, context, validation and service](clauses/05-onboarding-logic.md) | `develop` `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` |
| `SPEC-CAND-06` | [Onboarding form components](clauses/06-onboarding-components.md) | `develop` `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` |
| `SPEC-CAND-07` | [Services and hooks outside onboarding and dashboard](clauses/07-services-and-hooks.md) | `develop` `0d7fd6f6002cd2dff3c6b6716195cf051f5fad1c` |

## Running the checks

From the repo root:

```bash
node tools/check_spec_ts_links.mjs        # two-way link for Vitest tests, Environment line, citations resolve at the Described-at commit
node tools/check_spec_ts_links.mjs --traceability   # prints the rows of test-traceability.md
python3 tools/check_spec_cases.py         # header, sections, case schema, index tables
python3 tools/check_spec_test_links.py    # Python selectors only; reports case-unlinkable for every case here (expected)
npx vitest run                            # the tests the cases name
```

`check_spec_cases.py` accepts Python test selectors only and one fixed Environment string, so for every case it reports `test-field` and `environment`. Both are expected (see [checkers.md](checkers.md) "TypeScript tests in this repo"); every other rule must report nothing. `check_spec_test_links.py` reports `case-unlinkable` once per case for the same reason; the TypeScript checker above is the link check for this repo.
