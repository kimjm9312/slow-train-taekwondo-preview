import assert from "node:assert/strict";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";

async function login(username, password) {
  const response = await fetch(`${base}/api/v1/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
  assert.equal(response.status, 200, `login ${username}`);
  const body = await response.json(), cookie = response.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie); assert.ok(body.sessionToken); return { cookie, body };
}

async function call(cookie, path, init = {}, expected = 200) {
  const headers = new Headers(init.headers); headers.set("cookie", cookie); if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${base}${path}`, { ...init, headers });
  const body = response.status === 204 ? null : await response.json();
  assert.equal(response.status, expected, `${init.method || "GET"} ${path}: ${JSON.stringify(body)}`); return body;
}

const parent = await login("slowtrain_parent", "1234");
const parentSession = await call(parent.cookie, "/api/v1/auth/session");
assert.equal(parentSession.user.role, "parent"); assert.equal(parentSession.children[0].name, "김하준");
const bearerSession = await fetch(`${base}/api/v1/auth/session`, { headers: { authorization: `Bearer ${parent.body.sessionToken}` } });
assert.equal(bearerSession.status, 200, "mobile bearer session");
await call(parent.cookie, "/api/v1/admin/users", {}, 403);
const parentThreads = await call(parent.cookie, "/api/v1/chat/threads"), parentThread = parentThreads.threads[0];
await call(parent.cookie, `/api/v1/chat/threads/${parentThread.id}/messages`, { method: "POST", body: JSON.stringify({ message: `통합 검증 ${Date.now()}` }) }, 201);

const from = new Date().toISOString().slice(0, 10), to = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
const schedule = await call(parent.cookie, `/api/v1/sessions?from=${from}&to=${to}&childId=${parentSession.children[0].id}`);
const futureSession = schedule.sessions.find((item) => new Date(`${item.sessionDate}T${item.startTime}:00+09:00`).getTime() > Date.now() + 4 * 3600000);
assert.ok(futureSession, "seeded future class exists");
const reservation = await call(parent.cookie, "/api/v1/reservations", { method: "POST", body: JSON.stringify({ sessionId: futureSession.id, childId: parentSession.children[0].id, bookingType: "regular" }) }, 201);
assert.equal(reservation.reservation.status, "confirmed");
await call(parent.cookie, `/api/v1/reservations/${reservation.reservation.id}`, { method: "DELETE" });

const admin = await login("admin", "1234");
const trialResponse = await fetch(`${base}/api/v1/trials`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parentName: "검증 보호자", phone: "010-9999-9999", childName: "검증 아동", childAgeGroup: "초등 3·4학년" }) });
assert.equal(trialResponse.status, 201); const trial = (await trialResponse.json()).application;
await call(admin.cookie, `/api/v1/trials/${trial.id}`, { method: "PATCH", body: JSON.stringify({ status: "contacted" }) });
await call(admin.cookie, `/api/v1/trials/${trial.id}`, { method: "DELETE" }, 204);
const users = await call(admin.cookie, "/api/v1/admin/users"), parentUser = users.users.find((item) => item.username === "slowtrain_parent");
assert.ok(parentUser);
const nonce = Date.now();
const children = [];
for (const name of ["동시신청A", "동시신청B", "동시신청C"]) {
  const created = await call(admin.cookie, "/api/v1/children", { method: "POST", body: JSON.stringify({ parentId: parentUser.id, name: `${name}${nonce}`, ageGroup: "초등 3·4학년" }) }, 201);
  children.push(created.child);
}
const testDate = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
const classResult = await call(admin.cookie, "/api/v1/sessions", { method: "POST", body: JSON.stringify({ sessionDate: testDate, startTime: "20:30", endTime: "21:30", title: "동시성 검증", capacity: 1, waitCapacity: 1 }) }, 201);
const bookingRequest = (childId) => call(admin.cookie, "/api/v1/reservations", { method: "POST", body: JSON.stringify({ sessionId: classResult.session.id, childId, bookingType: "regular" }) }, 201);
const concurrent = await Promise.all([bookingRequest(children[0].id), bookingRequest(children[1].id)]);
assert.deepEqual(concurrent.map((item) => item.reservation.status).sort(), ["confirmed", "waiting"]);
await call(admin.cookie, "/api/v1/reservations", { method: "POST", body: JSON.stringify({ sessionId: classResult.session.id, childId: children[2].id, bookingType: "regular" }) }, 409);
const rosterBefore = await call(admin.cookie, `/api/v1/sessions/${classResult.session.id}/roster`), confirmed = rosterBefore.roster.find((item) => item.status === "confirmed");
await call(admin.cookie, `/api/v1/sessions/${classResult.session.id}/roster?reservationId=${confirmed.id}`, { method: "DELETE" });
const rosterAfter = await call(admin.cookie, `/api/v1/sessions/${classResult.session.id}/roster`);
assert.equal(rosterAfter.roster.filter((item) => item.status === "confirmed").length, 1, "waiting member promoted");

const notice = await call(admin.cookie, "/api/v1/content/notices", { method: "POST", body: JSON.stringify({ category: "검증", title: `CRUD ${nonce}`, content: "추가 검증" }) }, 201);
const updated = await call(admin.cookie, `/api/v1/content/notices/${notice.item.id}`, { method: "PATCH", body: JSON.stringify({ title: `CRUD 수정 ${nonce}` }) });
assert.equal(updated.item.title, `CRUD 수정 ${nonce}`);
await call(admin.cookie, `/api/v1/content/notices/${notice.item.id}`, { method: "DELETE" }, 204);
await call(admin.cookie, `/api/v1/sessions/${classResult.session.id}`, { method: "DELETE" }, 204);
for (const child of children) await call(admin.cookie, `/api/v1/children/${child.id}`, { method: "DELETE" });
const audit = await call(admin.cookie, "/api/v1/admin/audit-logs"); assert.ok(audit.logs.length > 0);

console.log("PASS cookie/bearer auth, role denial, chat, trials, database CRUD, booking/cancel, concurrency capacity, waitlist promotion, audit log");
