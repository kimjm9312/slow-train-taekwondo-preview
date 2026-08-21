import type { AuthUser } from "./auth";
import { ownsChild } from "./auth";
import { d1, many, one, run } from "./database";
import { ApiError } from "./http";
import { newId } from "./ids";

type ClassSession = {
  id: string; session_date: string; start_time: string; end_time: string; title: string;
  capacity: number; wait_capacity: number; status: string; booking_closes_minutes: number; change_closes_minutes: number;
};

function sessionAt(row: ClassSession) {
  return new Date(`${row.session_date}T${row.start_time}:00+09:00`).getTime();
}

function minutesUntil(row: ClassSession) {
  return (sessionAt(row) - Date.now()) / 60_000;
}

export async function listSessions(from: string, to: string, childId?: string) {
  await materializeFixedReservations(from, to);
  const childJoin = childId ? "LEFT JOIN reservations mine ON mine.session_id=s.id AND mine.child_id=? AND mine.status IN ('confirmed','waiting')" : "";
  const values: unknown[] = childId ? [childId, from, to] : [from, to];
  return many(`SELECT s.id,s.session_date AS sessionDate,s.start_time AS startTime,s.end_time AS endTime,s.title,s.capacity,s.wait_capacity AS waitCapacity,s.status,s.booking_closes_minutes AS bookingClosesMinutes,s.change_closes_minutes AS changeClosesMinutes,
    (SELECT COUNT(*) FROM reservations r WHERE r.session_id=s.id AND r.status='confirmed') AS confirmedCount,
    (SELECT COUNT(*) FROM reservations r WHERE r.session_id=s.id AND r.status='waiting') AS waitingCount
    ${childId ? ",mine.id AS myReservationId,mine.status AS myStatus,mine.booking_type AS myBookingType" : ""}
    FROM class_sessions s ${childJoin} WHERE s.session_date BETWEEN ? AND ? ORDER BY s.session_date,s.start_time`, ...values);
}

export async function materializeFixedReservations(from: string, to: string, onlySessionId?: string) {
  const rows = await many<{ sessionId: string; childId: string; sessionDate: string; startTime: string }>(`SELECT s.id AS sessionId,f.child_id AS childId,s.session_date AS sessionDate,s.start_time AS startTime
    FROM class_sessions s JOIN fixed_schedules f ON f.active=1 AND f.start_time=s.start_time AND f.weekday=CAST(strftime('%w',s.session_date) AS INTEGER)
    WHERE s.session_date BETWEEN ? AND ? AND s.status='open' ${onlySessionId ? "AND s.id=?" : ""}
    AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.session_id=s.id AND r.child_id=f.child_id) ORDER BY s.session_date,s.start_time,f.created_at`, from, to, ...(onlySessionId ? [onlySessionId] : []));
  for (const row of rows) {
    await run(`INSERT INTO reservations(id,session_id,child_id,session_date,start_time,booking_type,status)
      SELECT ?,s.id,?,?,?,'fixed','confirmed' FROM class_sessions s WHERE s.id=? AND s.status='open'
      AND (SELECT COUNT(*) FROM reservations r WHERE r.session_id=s.id AND r.status='confirmed')<s.capacity
      AND NOT EXISTS(SELECT 1 FROM reservations r WHERE r.session_id=s.id AND r.child_id=?)`, newId("res"), row.childId, row.sessionDate, row.startTime, row.sessionId, row.childId);
  }
}

export async function reserve(user: AuthUser, input: { sessionId: string; childId: string; bookingType: "regular" | "makeup"; makeupTicketId?: string }) {
  if (!(await ownsChild(user, input.childId))) throw new ApiError(403, "해당 자녀의 수업을 신청할 권한이 없습니다.", "FORBIDDEN");
  const session = await one<ClassSession>("SELECT * FROM class_sessions WHERE id=?", input.sessionId);
  if (!session || session.status !== "open") throw new ApiError(409, "현재 신청할 수 없는 수업입니다.", "SESSION_CLOSED");
  if (minutesUntil(session) <= session.booking_closes_minutes) throw new ApiError(409, "수업 신청 시간이 마감되었습니다.", "BOOKING_CLOSED");
  if (await one("SELECT id FROM restrictions WHERE child_id=? AND active=1 AND (session_id IS NULL OR session_id=?)", input.childId, input.sessionId)) throw new ApiError(403, "이 수업은 신청이 제한되어 있습니다.", "BOOKING_RESTRICTED");
  if (await one("SELECT id FROM reservations WHERE child_id=? AND session_date=? AND start_time=? AND status IN ('confirmed','waiting')", input.childId, session.session_date, session.start_time)) throw new ApiError(409, "같은 시간에 이미 신청한 수업이 있습니다.", "DUPLICATE_TIME");

  let ticket: { id: string } | null = null;
  if (input.bookingType === "makeup") {
    ticket = input.makeupTicketId ? await one<{ id: string }>("SELECT id FROM makeup_tickets WHERE id=? AND child_id=? AND status='available' AND expires_at>=CURRENT_TIMESTAMP", input.makeupTicketId, input.childId) : await one<{ id: string }>("SELECT id FROM makeup_tickets WHERE child_id=? AND status='available' AND expires_at>=CURRENT_TIMESTAMP ORDER BY expires_at LIMIT 1", input.childId);
    if (!ticket) throw new ApiError(409, "사용 가능한 보강권이 없습니다.", "NO_MAKEUP_TICKET");
  }

  await run("DELETE FROM reservations WHERE session_id=? AND child_id=? AND status='cancelled'", input.sessionId, input.childId);
  const reservationId = newId("res");
  const confirmed = await run(`INSERT INTO reservations(id,session_id,child_id,session_date,start_time,booking_type,status)
    SELECT ?,s.id,?,?,?,?,'confirmed' FROM class_sessions s WHERE s.id=? AND s.status='open'
    AND (SELECT COUNT(*) FROM reservations r WHERE r.session_id=s.id AND r.status='confirmed')<s.capacity`,
    reservationId, input.childId, session.session_date, session.start_time, input.bookingType, input.sessionId);

  let status: "confirmed" | "waiting" = "confirmed";
  if ((confirmed.meta.changes ?? 0) === 0) {
    status = "waiting";
    const waiting = await run(`INSERT INTO reservations(id,session_id,child_id,session_date,start_time,booking_type,status,wait_position)
      SELECT ?,s.id,?,?,?,?,'waiting',1 FROM class_sessions s WHERE s.id=? AND s.status='open'
      AND (SELECT COUNT(*) FROM reservations r WHERE r.session_id=s.id AND r.status='waiting')<s.wait_capacity`,
      reservationId, input.childId, session.session_date, session.start_time, input.bookingType, input.sessionId);
    if ((waiting.meta.changes ?? 0) === 0) throw new ApiError(409, "참가와 대기 정원이 모두 찼습니다.", "SESSION_FULL");
  }
  if (ticket) await run("UPDATE makeup_tickets SET status='reserved',used_reservation_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", reservationId, ticket.id);
  return { id: reservationId, sessionId: input.sessionId, childId: input.childId, bookingType: input.bookingType, status, makeupTicketId: ticket?.id ?? null };
}

export async function cancelReservation(user: AuthUser, reservationId: string) {
  const row = await one<ClassSession & { child_id: string; booking_type: string; status: string; session_id: string }>(`SELECT s.*,r.child_id,r.booking_type,r.status,r.session_id FROM reservations r JOIN class_sessions s ON s.id=r.session_id WHERE r.id=?`, reservationId);
  if (!row) throw new ApiError(404, "예약을 찾을 수 없습니다.", "NOT_FOUND");
  if (!(await ownsChild(user, row.child_id))) throw new ApiError(403, "예약을 취소할 권한이 없습니다.", "FORBIDDEN");
  if (!['confirmed','waiting'].includes(row.status)) throw new ApiError(409, "취소할 수 없는 예약입니다.", "INVALID_RESERVATION_STATUS");
  if (user.role !== "admin" && minutesUntil(row) <= row.change_closes_minutes) throw new ApiError(409, "변경·취소 시간이 마감되었습니다.", "CHANGE_CLOSED");

  await run("UPDATE reservations SET status='cancelled',cancelled_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?", reservationId);
  if (row.booking_type === "makeup") await run("UPDATE makeup_tickets SET status='available',used_reservation_id=NULL,updated_at=CURRENT_TIMESTAMP WHERE used_reservation_id=? AND expires_at>=CURRENT_TIMESTAMP", reservationId);
  let promoted: { id: string; child_id: string } | null = null;
  if (row.status === "confirmed") {
    promoted = await one<{ id: string; child_id: string }>("SELECT id,child_id FROM reservations WHERE session_id=? AND status='waiting' ORDER BY created_at LIMIT 1", row.session_id);
    if (promoted) await run(`UPDATE reservations SET status='confirmed',wait_position=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?
      AND (SELECT COUNT(*) FROM reservations WHERE session_id=? AND status='confirmed')<(SELECT capacity FROM class_sessions WHERE id=?)`, promoted.id, row.session_id, row.session_id);
  }
  return { cancelled: true, promotedChildId: promoted?.child_id ?? null };
}

export async function replaceFixedSchedule(childId: string, times: Record<string, string>) {
  const weekdayMap: Record<string, number> = { 월: 1, 화: 2, 수: 3, 목: 4, 금: 5 };
  const entries = Object.entries(times).filter(([day, time]) => weekdayMap[day] && /^\d{2}:\d{2}$/.test(time));
  if (![2, 3].includes(entries.length)) throw new ApiError(400, "고정수업은 주 2회 또는 주 3회만 가능합니다.", "INVALID_FIXED_PLAN");
  for (const [day, time] of entries) {
    const count = await one<{ count: number }>("SELECT COUNT(*) AS count FROM fixed_schedules WHERE weekday=? AND start_time=? AND active=1 AND child_id<>?", weekdayMap[day], time, childId);
    if ((count?.count ?? 0) >= 6) throw new ApiError(409, `${day}요일 ${time} 수업의 고정 정원이 찼습니다.`, "FIXED_CAPACITY_FULL");
  }
  await run("DELETE FROM reservations WHERE child_id=? AND booking_type='fixed' AND session_date>=date('now')", childId);
  await run("UPDATE fixed_schedules SET active=0,updated_at=CURRENT_TIMESTAMP WHERE child_id=?", childId);
  await d1().batch(entries.map(([day, time]) => d1().prepare("INSERT INTO fixed_schedules(id,child_id,weekday,start_time,active) VALUES(?,?,?,?,1)").bind(newId("fixed"), childId, weekdayMap[day], time)));
  const from = new Date().toISOString().slice(0, 10), to = new Date(Date.now() + 370 * 86400000).toISOString().slice(0, 10);
  await materializeFixedReservations(from, to);
  return entries.map(([day, time]) => ({ day, weekday: weekdayMap[day], time }));
}
