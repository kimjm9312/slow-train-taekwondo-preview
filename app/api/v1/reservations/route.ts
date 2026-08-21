import { audit } from "../../../../server/audit";
import { ownsChild, requireUser } from "../../../../server/auth";
import { reserve } from "../../../../server/booking";
import { many } from "../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request), url = new URL(request.url), childId = requiredText(url.searchParams.get("childId"), "자녀");
    if (!(await ownsChild(user, childId))) throw new ApiError(403, "예약을 조회할 권한이 없습니다.", "FORBIDDEN");
    return ok({ reservations: await many(`SELECT r.id,r.session_id AS sessionId,r.booking_type AS bookingType,r.status,r.wait_position AS waitPosition,s.session_date AS sessionDate,s.start_time AS startTime,s.end_time AS endTime,s.title
      FROM reservations r JOIN class_sessions s ON s.id=r.session_id WHERE r.child_id=? ORDER BY s.session_date DESC,s.start_time DESC`, childId) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request), body = await jsonBody<{ sessionId?: string; childId?: string; bookingType?: "regular" | "makeup"; makeupTicketId?: string }>(request);
    const input = { sessionId: requiredText(body.sessionId, "수업"), childId: requiredText(body.childId, "자녀"), bookingType: body.bookingType === "makeup" ? "makeup" as const : "regular" as const, makeupTicketId: body.makeupTicketId };
    const reservation = await reserve(user, input); await audit(request, user, "create", "reservation", reservation.id, null, reservation); return ok({ reservation }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
