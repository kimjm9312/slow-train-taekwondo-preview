import { audit } from "../../../../../server/audit";
import { requireAdmin, requireUser } from "../../../../../server/auth";
import { replaceFixedSchedule } from "../../../../../server/booking";
import { one, run } from "../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok } from "../../../../../server/http";

type FixedRequest = { id: string; child_id: string; requested_times_json: string; requested_by: string; status: string };

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, body = await jsonBody<{ action?: "approve" | "reject"; reason?: string }>(request), row = await one<FixedRequest>("SELECT * FROM fixed_schedule_requests WHERE id=?", id); if (!row) throw new ApiError(404, "변경 요청을 찾을 수 없습니다.", "NOT_FOUND"); if (row.status !== "pending") throw new ApiError(409, "이미 처리된 요청입니다.", "ALREADY_REVIEWED"); if (body.action === "approve") { const schedules = await replaceFixedSchedule(row.child_id, JSON.parse(row.requested_times_json)); await run("UPDATE fixed_schedule_requests SET status='approved',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?", actor.id, id); await audit(request, actor, "approve", "fixed_schedule_request", id, row, schedules); return ok({ status: "approved", schedules }); } await run("UPDATE fixed_schedule_requests SET status='rejected',reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,rejection_reason=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", actor.id, body.reason?.trim() ?? "", id); await audit(request, actor, "reject", "fixed_schedule_request", id, row, { reason: body.reason ?? "" }); return ok({ status: "rejected" }); }
  catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const user = await requireUser(request), { id } = await context.params, row = await one<FixedRequest>("SELECT * FROM fixed_schedule_requests WHERE id=?", id); if (!row) throw new ApiError(404, "변경 요청을 찾을 수 없습니다.", "NOT_FOUND"); if (user.role !== "admin" && row.requested_by !== user.id) throw new ApiError(403, "요청을 취소할 권한이 없습니다.", "FORBIDDEN"); if (row.status !== "pending") throw new ApiError(409, "대기 중인 요청만 취소할 수 있습니다.", "ALREADY_REVIEWED"); await run("UPDATE fixed_schedule_requests SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=?", id); await audit(request, user, "cancel", "fixed_schedule_request", id, row, { status: "cancelled" }); return ok({ status: "cancelled" }); }
  catch (error) { return handleApiError(error); }
}
