"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, json, localIsoDate } from "../lib/api";
import type { Child, Session, User } from "../types";

const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

function addDays(iso: string, amount: number) { const date = new Date(`${iso}T12:00:00`); date.setDate(date.getDate() + amount); return localIsoDate(date); }
function startOfWeek(iso: string) { const date = new Date(`${iso}T12:00:00`); const day = date.getDay(); date.setDate(date.getDate() - (day === 0 ? 6 : day - 1)); return localIsoDate(date); }

function bookingLabel(session: Session) {
  if (session.myStatus === "confirmed") return "참가 완료";
  if (session.myStatus === "waiting") return "대기 1번";
  const starts = new Date(`${session.sessionDate}T${session.startTime}:00+09:00`).getTime();
  if (session.status !== "open" || starts - Date.now() <= session.bookingClosesMinutes * 60_000) return "신청 마감";
  if (Number(session.confirmedCount) < Number(session.capacity)) return "참가";
  if (Number(session.waitingCount) < Number(session.waitCapacity)) return "대기 신청";
  return "만석";
}

export function ScheduleFeature({ user, child, notify }: { user: User; child?: Child; notify: (text: string, tone?: "success" | "error") => void }) {
  const [week, setWeek] = useState(() => startOfWeek(localIsoDate()));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busyId, setBusyId] = useState("");
  const [bookingType, setBookingType] = useState<"regular" | "makeup">("regular");
  const days = useMemo(() => Array.from({ length: 5 }, (_, index) => addDays(week, index)), [week]);
  const load = useCallback(async () => {
    if (!child && user.role !== "admin") return;
    try { const query = new URLSearchParams({ from: days[0], to: days[4] }); if (child) query.set("childId", child.id); const data = await api<{ sessions: Session[] }>(`/api/v1/sessions?${query}`); setSessions(data.sessions); }
    catch (error) { notify(error instanceof Error ? error.message : "시간표를 불러오지 못했습니다.", "error"); }
  }, [child, days, notify, user.role]);
  useEffect(() => { load(); }, [load]);

  async function handleBooking(session: Session) {
    if (!child) return notify("자녀 정보를 먼저 등록해주세요.", "error");
    const label = bookingLabel(session);
    if (["만석", "신청 마감"].includes(label)) return;
    setBusyId(session.id);
    try {
      if (session.myReservationId && session.myStatus) {
        if (session.myBookingType === "fixed") { await api("/api/v1/absences", json("POST", { reservationId: session.myReservationId, reasonCode: "personal" })); notify("결석 신청을 완료하고 보강권을 지급했습니다."); }
        else { await api(`/api/v1/reservations/${session.myReservationId}`, json("DELETE")); notify("수업 신청을 취소했습니다."); }
      } else {
        const result = await api<{ reservation: { status: string } }>("/api/v1/reservations", json("POST", { sessionId: session.id, childId: child.id, bookingType }));
        notify(result.reservation.status === "waiting" ? "대기 1번으로 신청되었습니다." : "수업 참가가 완료되었습니다.");
      }
      await load();
    } catch (error) { notify(error instanceof Error ? error.message : "예약을 처리하지 못했습니다.", "error"); }
    finally { setBusyId(""); }
  }

  return <section className="page-section">
    <header className="feature-header"><div><p className="eyebrow dark">CLASS SCHEDULE</p><h1>수업 시간표</h1><p>정원 6명 · 대기 1명 · 신청은 수업 1시간 전까지</p></div><div className="booking-mode"><button className={bookingType === "regular" ? "active" : ""} onClick={() => setBookingType("regular")}>일반 신청</button><button className={bookingType === "makeup" ? "active" : ""} onClick={() => setBookingType("makeup")}>보강 신청</button></div></header>
    <div className="week-nav"><button onClick={() => setWeek(addDays(week, -7))}>‹</button><strong>{week.slice(5).replace("-", ".")} — {days[4].slice(5).replace("-", ".")}</strong><button onClick={() => setWeek(addDays(week, 7))}>›</button></div>
    <div className="date-pills">{days.map((day) => { const date = new Date(`${day}T12:00:00`); return <div key={day} className={day === localIsoDate() ? "today" : ""}><b>{date.getDate()}</b><span>{weekdays[date.getDay()]}</span></div>; })}</div>
    <div className="schedule-list">{days.map((day) => <section key={day} className="day-group"><h2>{Number(day.slice(5, 7))}월 {Number(day.slice(8))}일 <small>{weekdays[new Date(`${day}T12:00:00`).getDay()]}요일</small></h2>{sessions.filter((session) => session.sessionDate === day).map((session) => { const label = bookingLabel(session), disabled = ["만석", "신청 마감"].includes(label); return <article className="session-card card" key={session.id}><div className="session-time"><b>{session.startTime}</b><span>{session.endTime} 종료</span></div><div className="session-info"><b>{session.title}</b><span>{Number(session.confirmedCount)}/{session.capacity}명 {Number(session.waitingCount) ? `· 대기 ${session.waitingCount}` : ""}</span><div className="capacity-dots">{Array.from({ length: session.capacity }, (_, i) => <i className={i < Number(session.confirmedCount) ? "filled" : ""} key={i} />)}</div></div><button className={`booking-button status-${label.replaceAll(" ", "-")}`} disabled={disabled || busyId === session.id} onClick={() => handleBooking(session)}>{busyId === session.id ? "처리 중" : label}{session.myStatus && <small>눌러서 취소</small>}</button></article>; })}{!sessions.some((session) => session.sessionDate === day) && <p className="empty day-empty">열린 수업이 없습니다.</p>}</section>)}</div>
  </section>;
}

export function FixedScheduleFeature({ user, child, notify }: { user: User; child?: Child; notify: (text: string, tone?: "success" | "error") => void }) {
  const [current, setCurrent] = useState<{ weekday: number; startTime: string }[]>([]);
  const [plan, setPlan] = useState<2 | 3>(3);
  const [times, setTimes] = useState<Record<string, string>>({ 월: "17:00", 수: "17:00", 금: "17:00" });
  const dayOptions = plan === 3 ? ["월", "수", "금"] : ["화", "목"];
  const slots = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
  useEffect(() => { if (!child) return; api<{ schedules: { weekday: number; startTime: string }[] }>(`/api/v1/fixed-schedules?childId=${child.id}`).then((data) => setCurrent(data.schedules)).catch(() => undefined); }, [child]);
  useEffect(() => { setTimes(Object.fromEntries(dayOptions.map((day) => [day, times[day] || "17:00"]))); }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps
  async function submit() {
    if (!child) return;
    try {
      if (user.role === "admin") await api("/api/v1/fixed-schedules", json("PUT", { childId: child.id, times }));
      else await api("/api/v1/fixed-schedule-requests", json("POST", { childId: child.id, times }));
      notify(user.role === "admin" ? "고정수업을 변경했습니다." : "관리자에게 고정수업 변경을 신청했습니다.");
    } catch (error) { notify(error instanceof Error ? error.message : "변경을 신청하지 못했습니다.", "error"); }
  }
  return <section className="page-section narrow"><header className="feature-header"><div><p className="eyebrow dark">FIXED SCHEDULE</p><h1>고정 수업 변경</h1><p>부모님이 신청하면 관리자 승인 후 적용됩니다.</p></div></header><div className="card form-card"><h2>{child?.name || "자녀"}님의 현재 수업</h2><p className="current-fixed">{current.length ? current.map((item) => `${weekdays[item.weekday]} ${item.startTime}`).join(" · ") : "등록된 고정수업이 없습니다."}</p><hr /><h2>변경할 수업</h2><div className="segmented plan-select"><button className={plan === 2 ? "active" : ""} onClick={() => setPlan(2)}>주 2회 · 화목</button><button className={plan === 3 ? "active" : ""} onClick={() => setPlan(3)}>주 3회 · 월수금</button></div><div className="fixed-times">{dayOptions.map((day) => <label key={day}><span>{day}요일</span><select value={times[day] || "17:00"} onChange={(event) => setTimes({ ...times, [day]: event.target.value })}>{slots.map((slot) => <option key={slot}>{slot}</option>)}</select></label>)}</div><button className="primary" onClick={submit}>{user.role === "admin" ? "바로 변경하기" : "관리자에게 변경 신청"}</button></div></section>;
}

export function MakeupFeature({ child, notify }: { child?: Child; notify: (text: string, tone?: "success" | "error") => void }) {
  const [tickets, setTickets] = useState<{ id: string; status: string; expiresAt: string }[]>([]);
  useEffect(() => { if (!child) return; api<{ tickets: { id: string; status: string; expiresAt: string }[] }>(`/api/v1/makeup-tickets?childId=${child.id}`).then((data) => setTickets(data.tickets)).catch((error) => notify(error instanceof Error ? error.message : "보강권을 불러오지 못했습니다.", "error")); }, [child, notify]);
  const available = tickets.filter((ticket) => ticket.status === "available");
  return <section className="page-section narrow"><header className="feature-header"><div><p className="eyebrow dark">MAKE-UP CLASS</p><h1>보강권</h1><p>보강권은 발급된 달의 말일까지 사용할 수 있습니다.</p></div></header><div className="ticket-hero"><span>사용 가능</span><strong>{available.length}<small>회</small></strong><p>{child?.name || "자녀"}님의 보강권</p></div><div className="card list-card"><h2>보강권 내역</h2>{tickets.map((ticket) => <div className="list-row" key={ticket.id}><div><b>{ticket.status === "available" ? "사용 가능" : ticket.status === "reserved" ? "예약 중" : "사용 완료"}</b><span>만료 {ticket.expiresAt.slice(0, 10)}</span></div><small>{ticket.id.slice(-6)}</small></div>)}{!tickets.length && <p className="empty">발급된 보강권이 없습니다.</p>}</div></section>;
}
