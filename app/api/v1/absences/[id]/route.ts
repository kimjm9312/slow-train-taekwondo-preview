import { audit } from "../../../../../server/audit";
import { requireAdmin } from "../../../../../server/auth";
import { d1, one, run } from "../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok } from "../../../../../server/http";
import { endOfMonthIso, newId } from "../../../../../server/ids";

type Absence = { id: string; reservation_id: string; status: string; child_id: string; session_date: string };

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const actor = await requireAdmin(request), { id } = await context.params, body = await jsonBody<{ action?: "approve" | "reject" }>(request), before = await one<Absence>(`SELECT a.*,r.child_id,s.session_date FROM absences a JOIN reservations r ON r.id=a.reservation_id JOIN class_sessions s ON s.id=r.session_id WHERE a.id=?`, id); if (!before) throw new ApiError(404, "결석 신청을 찾을 수 없습니다.", "NOT_FOUND"); if (before.status !== "pending") throw new ApiError(409, "처리 대기 중인 신청만 변경할 수 있습니다.", "ALREADY_REVIEWED"); if (body.action === "approve") { const ticketId = newId("makeup"); await d1().batch([d1().prepare("UPDATE absences SET status='approved',reviewed_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(actor.id,id),d1().prepare("INSERT INTO makeup_tickets(id,child_id,source_type,source_id,status,expires_at,issued_by) VALUES(?,?,?,?,?,?,?)").bind(ticketId,before.child_id,"absence",id,"available",endOfMonthIso(new Date(before.session_date)),actor.id)]); await audit(request,actor,"approve","absence",id,before,{status:"approved",ticketId}); return ok({status:"approved",ticketId}); } await run("UPDATE absences SET status='rejected',reviewed_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",actor.id,id); await audit(request,actor,"reject","absence",id,before,{status:"rejected"}); return ok({status:"rejected"}); }
  catch (error) { return handleApiError(error); }
}
