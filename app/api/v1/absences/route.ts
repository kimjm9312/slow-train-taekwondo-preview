import { audit } from "../../../../server/audit";
import { ownsChild, requireAdmin, requireUser } from "../../../../server/auth";
import { d1, many, one } from "../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";
import { endOfMonthIso, newId } from "../../../../server/ids";

type AbsenceReservation = { id: string; child_id: string; session_id: string; status: string; session_date: string; start_time: string; change_closes_minutes: number };

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return ok({ absences: await many(`SELECT a.id,a.reason_code AS reasonCode,a.reason_text AS reasonText,a.status,a.created_at AS createdAt,c.id AS childId,c.name AS childName,s.session_date AS sessionDate,s.start_time AS startTime
      FROM absences a JOIN reservations r ON r.id=a.reservation_id JOIN children c ON c.id=r.child_id JOIN class_sessions s ON s.id=r.session_id ORDER BY a.created_at DESC`) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request), body = await jsonBody<{ reservationId?: string; reasonCode?: string; reasonText?: string }>(request), reservationId = requiredText(body.reservationId, "예약"), reasonCode = requiredText(body.reasonCode, "결석 사유"), row = await one<AbsenceReservation>(`SELECT r.id,r.child_id,r.session_id,r.status,s.session_date,s.start_time,s.change_closes_minutes FROM reservations r JOIN class_sessions s ON s.id=r.session_id WHERE r.id=?`, reservationId);
    if (!row) throw new ApiError(404, "예약을 찾을 수 없습니다.", "NOT_FOUND"); if (!(await ownsChild(user, row.child_id))) throw new ApiError(403, "결석을 신청할 권한이 없습니다.", "FORBIDDEN"); if (row.status !== "confirmed") throw new ApiError(409, "참가 확정 수업만 결석 신청할 수 있습니다.", "INVALID_STATUS");
    const onTime = (new Date(`${row.session_date}T${row.start_time}:00+09:00`).getTime() - Date.now()) / 60_000 > row.change_closes_minutes, customReason = reasonCode === "other", status = !onTime ? "late" : customReason ? "pending" : "approved", absenceId = newId("absence"), ticketId = status === "approved" ? newId("makeup") : null;
    const statements = [
      d1().prepare("INSERT INTO absences(id,reservation_id,reason_code,reason_text,status) VALUES(?,?,?,?,?)").bind(absenceId, reservationId, reasonCode, body.reasonText?.trim() || null, status),
      d1().prepare("UPDATE reservations SET status='absent',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(reservationId),
      d1().prepare(`UPDATE reservations SET status='confirmed',wait_position=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=(SELECT id FROM reservations WHERE session_id=? AND status='waiting' ORDER BY created_at LIMIT 1)
        AND (SELECT COUNT(*) FROM reservations WHERE session_id=? AND status='confirmed')<(SELECT capacity FROM class_sessions WHERE id=?)`).bind(row.session_id, row.session_id, row.session_id),
    ];
    if (ticketId) statements.push(d1().prepare("INSERT INTO makeup_tickets(id,child_id,source_type,source_id,status,expires_at) VALUES(?,?,?,?,?,?)").bind(ticketId, row.child_id, "absence", absenceId, "available", endOfMonthIso(new Date(row.session_date))));
    await d1().batch(statements); await audit(request, user, "create", "absence", absenceId, null, { reservationId, reasonCode, status, ticketId }); return ok({ absence: { id: absenceId, reservationId, reasonCode, status }, makeupTicketId: ticketId }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
