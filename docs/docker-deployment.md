# Docker Deployment

This app builds as a Next.js standalone server and runs on port `3000` inside the container.

## Required Environment

`NEXT_PUBLIC_*` values are used by browser-side code, so pass them as Docker build args as well as runtime environment variables.

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
