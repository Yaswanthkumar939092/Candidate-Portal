# Docker Deployment

This app builds as a Next.js standalone server and runs on port `3000` inside the container.

## Required Environment

`NEXT_PUBLIC_*` values are used by browser-side code, so pass them as Docker build args. Runtime changes do not update browser bundles.

Required:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FRAPPE_URL`

Common production integrations:

- `FRAPPE_BASE_URL`
- `FRAPPE_API_KEY`
- `FRAPPE_API_SECRET`
- `FRAPPE_USERNAME`
- `FRAPPE_PASSWORD`
- `FRAPPE_WEBHOOK_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `FROM_EMAIL`
- `FROM_NAME`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_LINKEDIN_CLIENT_ID`

## Build

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  --build-arg NEXT_PUBLIC_FRAPPE_URL="$NEXT_PUBLIC_FRAPPE_URL" \
  -t candidate-portal:latest .
```

## Run

```bash
docker run --rm \
  --env-file .env.local \
  -p 3000:3000 \
  candidate-portal:latest
```

## Docker Compose

Create a local `.env` or export the variables in your shell, then run:

```bash
docker compose up --build -d
```

The compose file maps `${PORT:-3000}` on the host to port `3000` in the container.

## GitHub Container Registry

After every merge to `develop`, GitHub Actions creates a patch release and publishes the image to:

```text
ghcr.io/hybrowlabs/candidate-portal
```

See [GitHub Workflows](./github-workflows.md) for release tags and required repository variables.

## UAT delivery contract

The browser uses the same-origin `/backend/*` path. Next.js Node middleware
owns that path and reads `FRAPPE_BASE_URL` at runtime. Supply an HTTP(S) origin
without credentials, path, query or fragment. Missing/invalid configuration
returns 503. Do not route `/backend` directly to Frappe at ingress.
`NEXT_PUBLIC_FRAPPE_URL` is public build-time configuration (including image
host allowlisting); changing container environment does not change browser
bundles. Never put credentials in either URL. All `NEXT_PUBLIC_*` arguments
must be intentionally public. Server credentials are runtime-only secret
injections; never build arguments, Docker context files, or CI log output.

The image listens on `0.0.0.0:3000` as UID/GID 1001. `GET /api/health`
returns 200 and `{"status":"ok"}` with no cache and no upstream dependency.
Use it for startup, liveness and readiness. It proves process availability,
not Frappe availability; monitor upstream separately to avoid restart storms.

There is no Kubernetes manifest convention in this repository. For the owning
deployment repository, use this container/pod fragment (not a deployable manifest):

```yaml
spec:
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: candidate-portal
      image: ACCOUNT.dkr.ecr.REGION.amazonaws.com/REPOSITORY@sha256:REPLACE_WITH_VERIFIED_DIGEST
      ports:
        - name: http
          containerPort: 3000
      env:
        - name: FRAPPE_BASE_URL
          value: https://frappe.example.invalid
      resources:
        requests: {cpu: 100m, memory: 256Mi}
        limits: {cpu: "1", memory: 1Gi}
      securityContext:
        readOnlyRootFilesystem: true
        allowPrivilegeEscalation: false
        capabilities: {drop: ["ALL"]}
      startupProbe:
        httpGet: {path: /api/health, port: http}
        periodSeconds: 2
        failureThreshold: 60
      livenessProbe:
        httpGet: {path: /api/health, port: http}
        periodSeconds: 10
        timeoutSeconds: 3
      readinessProbe:
        httpGet: {path: /api/health, port: http}
        periodSeconds: 5
        timeoutSeconds: 3
      volumeMounts:
        - {name: tmp, mountPath: /tmp}
        - {name: next-cache, mountPath: /app/.next/cache}
  volumes:
    - name: tmp
      emptyDir: {sizeLimit: 64Mi}
    - name: next-cache
      emptyDir: {sizeLimit: 128Mi}
```

Resource values are starting limits for UAT and require load measurements.

### Immutable ECR publication

The manual `UAT image evidence` workflow builds once, smoke-tests the image
with a mock Frappe upstream under a read-only filesystem and dropped
capabilities, generates a CycloneDX SBOM, and gates HIGH/CRITICAL vulnerabilities
(including unfixed ones) and detected secrets before pushing that same image.
It requires an existing ECR repository with tag mutability exactly `IMMUTABLE`.
It never creates infrastructure or deploys.

Configure the `uat-image` GitHub environment with public build variables plus
`AWS_REGION`, `ECR_REPOSITORY`, and `AWS_UAT_IMAGE_ROLE_ARN`. The AWS role must
trust GitHub OIDC for this repository/environment and permit only ECR
authentication, repository/image inspection and push to the selected repository.
No static AWS keys are used. Restrict environment access to approved refs.

The artifact contains `image-reference.txt` (deploy only this digest reference),
`source-commit.txt`, `sbom.cdx.json`, `vulnerabilities.json` and checksums.
A failed run's partial artifacts are diagnostic evidence, not a release.
Base image tags and existing action major tags remain updateable; the lockfile
locks application resolution, while the published digest identifies the exact
image bytes. Existing GHCR release automation is separate from this UAT path.
