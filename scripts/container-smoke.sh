#!/usr/bin/env bash
set -euo pipefail
image="${1:?image required}"
suffix="$$"
network="portal-smoke-$suffix"
portal="portal-$suffix"
upstream="frappe-$suffix"
cleanup() {
  docker rm -f "$portal" "$upstream" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT
test "$(docker image inspect --format '{{.Config.User}}' "$image")" = "1001:1001"
docker network create "$network" >/dev/null
docker run -d --name "$upstream" --network "$network" --entrypoint node "$image" -e '
require("http").createServer((req,res)=>{
 let body=""; req.on("data",d=>body+=d); req.on("end",()=>{
 res.setHeader("Set-Cookie",["candidate_portal_session=smoke; HttpOnly; Path=/; SameSite=Lax","second=ok; Path=/"]);
 res.end(JSON.stringify({url:req.url,method:req.method,body,cookie:req.headers.cookie}));
 });
}).listen(8000,"0.0.0.0")' >/dev/null
docker run -d --name "$portal" --network "$network" --read-only   --tmpfs /tmp:rw,noexec,nosuid,size=64m   --tmpfs /app/.next/cache:rw,nosuid,uid=1001,gid=1001,size=128m   --cap-drop ALL --security-opt no-new-privileges   -e FRAPPE_BASE_URL="http://$upstream:8000" "$image" >/dev/null
ready=0
for attempt in $(seq 1 60); do
  if docker exec "$portal" node container-health.mjs; then ready=1; break; fi
  sleep 2
done
test "$ready" = 1
docker exec "$portal" node -e '
const assert=require("node:assert/strict");
(async()=>{
 assert.notEqual(process.getuid(),0);
 const r=await fetch("http://127.0.0.1:3000/backend/api/method/smoke?x=1",{
 method:"POST",headers:{"Content-Type":"application/json",Cookie:"candidate_portal_session=request"},
 body:JSON.stringify({smoke:true})});
 assert.equal(r.status,200);
 assert.equal(r.headers.getSetCookie().length,2);
 const body=await r.json();
 assert.deepEqual(body,{url:"/api/method/smoke?x=1",method:"POST",body:JSON.stringify({smoke:true}),cookie:"candidate_portal_session=request"});
})().catch(()=>{console.error("Proxy contract failed");process.exitCode=1;});'
echo "PASS: non-root, read-only runtime, health, proxy POST/query/body/cookies"
