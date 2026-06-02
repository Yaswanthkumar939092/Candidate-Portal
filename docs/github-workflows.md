# GitHub Workflows

## Pull Request Gate

`PR Quality Gate` runs for every pull request targeting `develop`.

Required checks:

- `Quality Gate`: installs dependencies, runs ESLint, runs Vitest with coverage, enforces 85% global coverage, and builds the Next.js app.
- `Dependency Review`: blocks new high or critical vulnerable dependency changes in pull requests.
- `NPM Security Audit`: blocks high or critical npm audit findings and uploads the audit report.
- `CodeQL Analysis`: scans JavaScript and TypeScript code for security issues.
- `Docker Build and Scan`: builds the production Docker image and fails on high or critical container vulnerabilities.

The workflow uploads coverage and npm audit reports as artifacts.

## Release On Develop

`Release Develop` runs after a pull request is merged into `develop`.

It:

- Computes the next patch tag from the latest `vX.Y.Z` tag.
- Creates and pushes the new tag.
- Creates a GitHub Release.
- Builds and pushes the Docker image to GitHub Container Registry.

Image tags:

- `ghcr.io/hybrowlabs/candidate-portal:vX.Y.Z`
- `ghcr.io/hybrowlabs/candidate-portal:<commit-sha>`
- `ghcr.io/hybrowlabs/candidate-portal:develop-latest`

## Required Repository Variables

Configure these repository variables before relying on release image publishing:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FRAPPE_URL`

Optional:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_LINKEDIN_CLIENT_ID`

## Develop Branch Protection

Protect `develop` with these settings:

- Require a pull request before merging.
- Require at least 1 approval.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Required checks:
  - `PR Quality Gate / Quality Gate`
  - `PR Quality Gate / Dependency Review`
  - `PR Quality Gate / NPM Security Audit`
  - `PR Quality Gate / CodeQL Analysis`
  - `PR Quality Gate / Docker Build and Scan`
- Block force pushes.
- Block branch deletions.
- Do not allow bypassing the above settings unless intentionally limited to repository admins.
