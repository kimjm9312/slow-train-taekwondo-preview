import { audit } from "../../../../server/audit";
import { ownsChild, requireUser } from "../../../../server/auth";
import { many, run } from "../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";
import { newId } from "../../../../server/ids";

export async function GET(request: Request) {
  try { const user = await requireUser(request); const rows = user.role === "admin" ? await many<Record<string, unknown>>(`SELECT f.id,f.child_id AS childId,c.name AS childName,f.requested_plan AS requestedPlan,f.requested_times_json AS requestedTimesJson,f.status,f.rejection_reason AS rejectionReason,f.created_at AS createdAt FROM fixed_schedule_requests f JOIN children c ON c.id=f.child_id ORDER BY f.created_at DESC`) : await many<Record<string, unknown>>(`SELECT f.id,f.child_id AS childId,c.name AS childName,f.requested_plan AS requestedPlan,f.requested_times_json AS requestedTimesJson,f.status,f.rejection_reason AS rejectionReason,f.created_at AS createdAt FROM fixed_schedule_requests f JOIN children c ON c.id=f.child_id WHERE f.requested_by=? ORDER BY f.created_at DESC`, user.id); return ok({ requests: rows.map((row: Record<string, unknown>) => ({ ...row, requestedTimes: JSON.parse(String(row.requestedTimesJson)), requestedTimesJson: undefined })) }); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try { const user = await requireUser(request), body = await jsonBody<{ childId?: string; times?: Record<string, string> }>(request), childId = requiredText(body.childId, "자녀"), times = body.times ?? {}; if (!(await ownsChild(user, childId))) throw new ApiError(403, "변경을 신청할 권한이 없습니다.", "FORBIDDEN"); const count = Object.keys(times).length; if (![2,3].includes(count)) throw new ApiError(400, "주 2회 또는 주 3회만 신청할 수 있습니다.", "INVALID_FIXED_PLAN"); const id = newId("fixedreq"); await run("INSERT INTO fixed_schedule_requests(id,child_id,requested_plan,requested_times_json,status,requested_by) VALUES(?,?,?,?,?,?)", id, childId, String(count), JSON.stringify(times), user.role === "admin" ? "approved" : "pending", user.id); await audit(request, user, "create", "fixed_schedule_request", id, null, { childId, times }); return ok({ request: { id, childId, requestedPlan: String(count), requestedTimes: times, status: user.role === "admin" ? "approved" : "pending" } }, { status: 201 }); }
  catch (error) { return handleApiError(error); }
}
