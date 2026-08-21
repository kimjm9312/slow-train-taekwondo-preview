"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, json } from "../lib/api";
import type { Child, ContentItem, User } from "../types";

export function HomeFeature({ user, child, go, notify }: { user: User; child?: Child; go: (page: string) => void; notify: (text: string, tone?: "success" | "error") => void }) {
  const [notices, setNotices] = useState<ContentItem[]>([]);
  const [fixedSchedules, setFixedSchedules] = useState<{ weekday: number; startTime: string }[]>([]);
  const [trialOpen, setTrialOpen] = useState(false);
  useEffect(() => { api<{ items: ContentItem[] }>("/api/v1/content/notices").then((data) => setNotices(data.items)).catch(() => undefined); }, []);
  useEffect(() => { if (!child) return; api<{ schedules: { weekday: number; startTime: string }[] }>(`/api/v1/fixed-schedules?childId=${child.id}`).then((data) => setFixedSchedules(data.schedules)).catch(() => undefined); }, [child]);
  const fixedDays = fixedSchedules.map((item) => ["일", "월", "화", "수", "목", "금", "토"][item.weekday]).join(" · ");
  const fixedTime = fixedSchedules.length && fixedSchedules.every((item) => item.startTime === fixedSchedules[0].startTime) ? fixedSchedules[0].startTime : "요일별 시간";

  async function submitTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { await api("/api/v1/trials", json("POST", Object.fromEntries(form))); notify("상담 및 체험수업 신청이 접수되었습니다."); setTrialOpen(false); }
    catch (error) { notify(error instanceof Error ? error.message : "신청을 접수하지 못했습니다.", "error"); }
  }

  return <>
    <section className="hero">
      <p className="hero-watermark">SLOW TRAIN TAEKWONDO</p>
      <div className="hero-copy">
        <p className="eyebrow">NOT SPEEDY, BUT STEADY.</p>
        <h1>더 나은 내일을 향한<br />아이만의 여정</h1>
        <p className="hero-philosophy">우리는 지나치는 역이 없습니다.<br />발달장애인의 성장과 사회적 연결을 위해 달립니다.</p>
      </div>
      <button className="hero-cta" onClick={() => setTrialOpen(true)}>상담 및 체험수업 신청 <span>→</span></button>
    </section>

    <section className="quick-grid">
      <button className="quick-card" onClick={() => go("schedule")}><span className="quick-icon">時</span><b>수업 시간표</b><small>참가·변경·취소</small></button>
      <button className="quick-card" onClick={() => go("makeup")}><span className="quick-icon">補</span><b>보강권</b><small>잔여 횟수·사용기한</small></button>
    </section>

    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow dark">MY SCHEDULE</p><h2>{child ? `${child.name}님의 고정 수업` : "수업 정보"}</h2></div><button className="text-button" onClick={() => go("fixed")}>변경 신청 →</button></div>
      <div className="card schedule-summary"><div><strong>주 {fixedSchedules.length || "-"}회</strong><span>{fixedDays || "고정수업 미등록"}</span></div><div><strong>{fixedTime || "-"}</strong><span>고정 수업</span></div><button onClick={() => go("schedule")}>시간표 보기</button></div>
    </section>

    <section className="section-block">
      <div className="section-heading"><div><p className="eyebrow dark">NOTICE</p><h2>공지사항</h2></div><button className="text-button" onClick={() => go("center")}>전체 보기 →</button></div>
      <div className="card notice-list">{notices.slice(0, 3).map((notice) => <button key={notice.id} onClick={() => go("center")}><span>{String(notice.category || "안내")}</span><b>{String(notice.title)}</b><small>›</small></button>)}{!notices.length && <p className="empty">등록된 공지사항이 없습니다.</p>}</div>
    </section>

    <section className="home-statement"><p>한 정거장, 한 정거장<br />지나치지 않고 천천히.</p><span>slow train</span></section>

    {trialOpen && <div className="modal-backdrop" onMouseDown={() => setTrialOpen(false)}><section className="modal card" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setTrialOpen(false)}>×</button><p className="eyebrow dark">TRIAL CLASS</p><h2>상담 및 체험수업 신청</h2><form className="stack-form" onSubmit={submitTrial}><label>보호자 이름<input name="parentName" defaultValue={user.name} required /></label><label>연락처<input name="phone" defaultValue={user.phone} required /></label><label>자녀 이름<input name="childName" defaultValue={child?.name || ""} required /></label><label>자녀 연령<select name="childAgeGroup" defaultValue={child?.ageGroup}><option>초등 1·2학년</option><option>초등 3·4학년</option><option>초등 5·6학년</option><option>중학생</option><option>고등학생</option><option>성인</option></select></label><label>희망일<input name="preferredDate" type="date" /></label><label>문의 내용<textarea name="note" rows={3} /></label><button className="primary">신청하기</button></form></section></div>}
  </>;
}
