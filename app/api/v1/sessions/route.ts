import { audit } from "../../../../server/audit";
import { ownsChild, requireAdmin, requireUser } from "../../../../server/auth";
import { listSessions, materializeFixedReservations } from "../../../../server/booking";
import { one, run } from "../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";
import { newId } from "../../../../server/ids";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request), url = new URL(request.url), from = requiredText(url.searchParams.get("from"), "조회 시작일"), to = requiredText(url.searchParams.get("to"), "조회 종료일"), childId = url.searchParams.get("childId") ?? undefined;
    if (childId && !(await ownsChild(user, childId))) throw new ApiError(403, "시간표를 조회할 권한이 없습니다.", "FORBIDDEN");
    return ok({ sessions: await listSessions(from, to, childId) });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await requireAdmin(request), body = await jsonBody<{ sessionDate?: string; startTime?: string; endTime?: string; title?: string; capacity?: number; waitCapacity?: number; status?: string; bookingClosesMinutes?: number; changeClosesMinutes?: number }>(request), id = newId("class");
    const setting = await one<{ value_json: string }>("SELECT value_json FROM app_settings WHERE key='booking_policy'"), policy = setting ? JSON.parse(setting.value_json) as Record<string, number> : {};
    const sessionDate = requiredText(body.sessionDate, "수업일"), startTime = requiredText(body.startTime, "시작 시간"), endTime = requiredText(body.endTime, "종료 시간"), capacity = Number(body.capacity ?? policy.capacity ?? 6), waitCapacity = Number(body.waitCapacity ?? policy.waitCapacity ?? 1), status = body.status === "closed" ? "closed" : "open", bookingClosesMinutes = Number(body.bookingClosesMinutes ?? policy.bookingClosesMinutes ?? 60), changeClosesMinutes = Number(body.changeClosesMinutes ?? policy.changeClosesMinutes ?? 180);
    if (capacity < 1 || waitCapacity < 0) throw new ApiError(400, "정원 설정을 확인해주세요.", "INVALID_CAPACITY");
    await run("INSERT INTO class_sessions(id,session_date,start_time,end_time,title,capacity,wait_capacity,status,booking_closes_minutes,change_closes_minutes) VALUES(?,?,?,?,?,?,?,?,?,?)", id, sessionDate, startTime, endTime, body.title?.trim() || "발달 태권도", capacity, waitCapacity, status, bookingClosesMinutes, changeClosesMinutes);
    await materializeFixedReservations(sessionDate, sessionDate, id);
    const session = { id, sessionDate, startTime, endTime, title: body.title?.trim() || "발달 태권도", capacity, waitCapacity, status, bookingClosesMinutes, changeClosesMinutes }; await audit(request, actor, "create", "class_session", id, null, session); return ok({ session }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
