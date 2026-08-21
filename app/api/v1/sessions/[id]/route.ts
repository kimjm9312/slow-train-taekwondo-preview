import { audit } from "../../../../../server/audit";
import { requireAdmin } from "../../../../../server/auth";
import { one, run } from "../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok } from "../../../../../server/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request), { id } = await context.params, body = await jsonBody<Record<string, unknown>>(request), before = await one<Record<string, unknown>>("SELECT * FROM class_sessions WHERE id=?", id);
    if (!before) throw new ApiError(404, "수업을 찾을 수 없습니다.", "NOT_FOUND");
    const values = {
      sessionDate: typeof body.sessionDate === "string" ? body.sessionDate : before.session_date,
      startTime: typeof body.startTime === "string" ? body.startTime : before.start_time,
      endTime: typeof body.endTime === "string" ? body.endTime : before.end_time,
      title: typeof body.title === "string" ? body.title.trim() : before.title,
      capacity: Number(body.capacity ?? before.capacity), waitCapacity: Number(body.waitCapacity ?? before.wait_capacity),
      status: ['open','closed','cancelled'].includes(String(body.status)) ? body.status : before.status,
      bookingClosesMinutes: Number(body.bookingClosesMinutes ?? before.booking_closes_minutes), changeClosesMinutes: Number(body.changeClosesMinutes ?? before.change_closes_minutes),
    };
    await run("UPDATE class_sessions SET session_date=?,start_time=?,end_time=?,title=?,capacity=?,wait_capacity=?,status=?,booking_closes_minutes=?,change_closes_minutes=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", ...Object.values(values), id);
    const after = await one("SELECT * FROM class_sessions WHERE id=?", id); await audit(request, actor, "update", "class_session", id, before, after); return ok({ session: after });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, before = await one("SELECT * FROM class_sessions WHERE id=?", id); if (!before) throw new ApiError(404, "수업을 찾을 수 없습니다.", "NOT_FOUND"); await run("DELETE FROM class_sessions WHERE id=?", id); await audit(request, actor, "delete", "class_session", id, before, null); return new Response(null, { status: 204 }); }
  catch (error) { return handleApiError(error); }
}
