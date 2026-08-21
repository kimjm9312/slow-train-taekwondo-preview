import { audit } from "../../../../../../server/audit";
import { requireAdmin } from "../../../../../../server/auth";
import { reserve, cancelReservation } from "../../../../../../server/booking";
import { many, one, run } from "../../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../../../server/http";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireAdmin(request); const { id } = await context.params; return ok({ roster: await many(`SELECT r.id,r.status,r.booking_type AS bookingType,r.wait_position AS waitPosition,c.id AS childId,c.name AS childName,u.name AS parentName,u.phone
    FROM reservations r JOIN children c ON c.id=r.child_id JOIN users u ON u.id=c.parent_id WHERE r.session_id=? AND r.status IN ('confirmed','waiting') ORDER BY CASE r.status WHEN 'confirmed' THEN 0 ELSE 1 END,r.created_at`, id) }); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, body = await jsonBody<{ childId?: string }>(request), childId = requiredText(body.childId, "회원"); const reservation = await reserve(actor, { sessionId: id, childId, bookingType: "regular" }); await audit(request, actor, "admin_add", "reservation", reservation.id, null, reservation); return ok({ reservation }, { status: 201 }); }
  catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin(request), { id } = await context.params, body = await jsonBody<{ reservationId?: string; status?: "confirmed" | "no_show" }>(request), reservationId = requiredText(body.reservationId, "예약");
    const before = await one<{ id: string; session_id: string; status: string; booking_type: string }>("SELECT id,session_id,status,booking_type FROM reservations WHERE id=?", reservationId);
    if (!before || before.session_id !== id) throw new ApiError(404, "예약을 찾을 수 없습니다.", "NOT_FOUND");
    const status = body.status === "confirmed" ? "confirmed" : "no_show";
    await run("UPDATE reservations SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", status, reservationId);
    if (status === "no_show" && before.booking_type === "makeup") await run("UPDATE makeup_tickets SET status='used',updated_at=CURRENT_TIMESTAMP WHERE used_reservation_id=?", reservationId);
    if (status === "no_show" && before.status === "confirmed") await run(`UPDATE reservations SET status='confirmed',wait_position=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=(SELECT id FROM reservations WHERE session_id=? AND status='waiting' ORDER BY created_at LIMIT 1)
      AND (SELECT COUNT(*) FROM reservations WHERE session_id=? AND status='confirmed')<(SELECT capacity FROM class_sessions WHERE id=?)`, id, id, id);
    await audit(request, actor, "attendance", "reservation", reservationId, before, { status });
    return ok({ reservation: { id: reservationId, status } });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, url = new URL(request.url), reservationId = requiredText(url.searchParams.get("reservationId"), "예약"); const row = await one<{ session_id: string }>("SELECT session_id FROM reservations WHERE id=?", reservationId); if (!row || row.session_id !== id) throw new ApiError(404, "예약을 찾을 수 없습니다.", "NOT_FOUND"); const result = await cancelReservation(actor, reservationId); await audit(request, actor, "admin_remove", "reservation", reservationId, null, result); return ok(result); }
  catch (error) { return handleApiError(error); }
}
