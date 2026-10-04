#!/usr/bin/env bash
# Resolve the current digest of the distroless runtime base and update the
# pin in Dockerfile. Optionally build the image and run the strict Trivy gate.
#
# Usage:
#   scripts/refresh-distroless-pin.sh            # check only; exit 10 if the pin is stale
#   scripts/refresh-distroless-pin.sh --write    # update Dockerfile to the current digest
#   scripts/refresh-distroless-pin.sh --write --scan
#                                                # update, build locally, run strict Trivy gate
set -euo pipefail

IMAGE_REPO="${IMAGE_REPO:-gcr.io/distroless/nodejs22-debian13}"
IMAGE_TAG="${IMAGE_TAG:-nonroot}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"
SCAN_TAG="${SCAN_TAG:-candidate-portal:base-refresh}"

write=false
scan=false
for arg in "$@"; do
  case "$arg" in
    --write) write=true ;;
    --scan) scan=true ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) echo "unknown argument: $arg" >&2; exit 2 ;;
  esac
done

registry="${IMAGE_REPO%%/*}"
repository="${IMAGE_REPO#*/}"
manifest_url="https://${registry}/v2/${repository}/manifests/${IMAGE_TAG}"
accept="application/vnd.oci.image.index.v1+json,application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.oci.image.manifest.v1+json,application/vnd.docker.distribution.manifest.v2+json"

resolve_digest() {
  local headers status token
  headers="$(curl -sSI -H "Accept: ${accept}" "$manifest_url")"
  status="$(printf '%s\n' "$headers" | awk 'NR==1 {print $2}')"
  if [[ "$status" == "401" ]]; then
    local challenge realm service
    challenge="$(printf '%s\n' "$headers" | tr -d '\r' | awk 'tolower($1)=="www-authenticate:" {sub(/^[^ ]+ /, ""); print}')"
    realm="$(printf '%s' "$challenge" | sed -n 's/.*realm="\([^"]*\)".*/\1/p')"
    service="$(printf '%s' "$challenge" | sed -n 's/.*service="\([^"]*\)".*/\1/p')"
    token="$(curl -sSf "${realm}?service=${service}&scope=repository:${repository}:pull" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
    headers="$(curl -sSI -H "Accept: ${accept}" -H "Authorization: Bearer ${token}" "$manifest_url")"
    status="$(printf '%s\n' "$headers" | awk 'NR==1 {print $2}')"
  fi
  if [[ "$status" != "200" ]]; then
    echo "registry returned HTTP ${status:-none} for ${IMAGE_REPO}:${IMAGE_TAG}" >&2
    return 1
  fi
  printf '%s\n' "$headers" | tr -d '\r' | awk 'tolower($1)=="docker-content-digest:" {print $2}'
}

latest="$(resolve_digest)"
if [[ ! "$latest" =~ ^sha256:[a-f0-9]{64}$ ]]; then
  echo "could not resolve a digest for ${IMAGE_REPO}:${IMAGE_TAG}" >&2
  exit 1
fi

escaped_repo="${IMAGE_REPO//./\\.}"
current="$(grep -Eo "${escaped_repo}:${IMAGE_TAG}@sha256:[a-f0-9]{64}" "$DOCKERFILE" | head -n1 | sed 's/.*@//')"
if [[ -z "$current" ]]; then
  echo "no pinned ${IMAGE_REPO}:${IMAGE_TAG}@sha256:... reference found in ${DOCKERFILE}" >&2
  exit 1
fi

echo "pinned: ${current}"
echo "latest: ${latest}"

if [[ "$current" == "$latest" ]]; then
  echo "pin is current"
elif [[ "$write" == true ]]; then
  sed -i.bak "s#${escaped_repo}:${IMAGE_TAG}@${current}#${IMAGE_REPO}:${IMAGE_TAG}@${latest}#" "$DOCKERFILE"
  rm -f "${DOCKERFILE}.bak"
  echo "updated ${DOCKERFILE} to ${latest}"
else
  echo "pin is stale; re-run with --write to update ${DOCKERFILE}"
  exit 10
fi

if [[ "$scan" == true ]]; then
  command -v docker >/dev/null || { echo "docker is required for --scan" >&2; exit 1; }
  command -v trivy >/dev/null || { echo "trivy is required for --scan" >&2; exit 1; }
  docker build -t "$SCAN_TAG" .
  trivy image \
    --scanners vuln,secret \
    --severity HIGH,CRITICAL \
    --ignore-unfixed=false \
    --exit-code 1 \
    "$SCAN_TAG"
fi
