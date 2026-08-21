"use client";

import { useEffect, useState } from "react";
import { api, mediaUrl } from "../lib/api";
import type { ContentItem } from "../types";

function parseList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  try { const parsed = JSON.parse(String(value || "[]")); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; }
}

export function CenterFeature({ notify }: { notify: (text: string, tone?: "success" | "error") => void }) {
  const [sections, setSections] = useState<ContentItem[]>([]), [programs, setPrograms] = useState<ContentItem[]>([]), [staff, setStaff] = useState<ContentItem[]>([]), [facilities, setFacilities] = useState<ContentItem[]>([]), [faqs, setFaqs] = useState<ContentItem[]>([]), [notices, setNotices] = useState<ContentItem[]>([]);
  useEffect(() => { Promise.all([api<{ sections: ContentItem[] }>("/api/v1/center"), ...["programs", "staff", "facilities", "faqs", "notices"].map((resource) => api<{ items: ContentItem[] }>(`/api/v1/content/${resource}`))]).then(([center, p, s, f, q, n]) => { setSections(center.sections); setPrograms(p.items); setStaff(s.items); setFacilities(f.items); setFaqs(q.items); setNotices(n.items); }).catch((error) => notify(error instanceof Error ? error.message : "센터 정보를 불러오지 못했습니다.", "error")); }, [notify]);
  const philosophy = sections.find((item) => item.key === "philosophy"), address = sections.find((item) => item.key === "address");
  return <section className="page-section center-page">
    <header className="feature-header"><div><p className="eyebrow dark">ABOUT SLOW TRAIN</p><h1>센터 소개</h1><p>아이의 속도를 존중하는 발달 태권도</p></div></header>
    <section className="philosophy-card"><p className="eyebrow">OUR PHILOSOPHY</p><h2>{String(philosophy?.title || "아이만의 여정")}</h2><p>{String(philosophy?.content || "").split("\n").map((line) => <span key={line}>{line}<br /></span>)}</p></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow dark">PROGRAM</p><h2>프로그램</h2></div></div><div className="program-grid">{programs.map((program, index) => <article className="card program-card" key={program.id}><span>0{index + 1}</span><h3>{String(program.name)}</h3><b>{String(program.summary)}</b><p>{String(program.description)}</p></article>)}</div></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow dark">OUR TEAM</p><h2>지도진</h2></div></div><div className="team-grid">{staff.map((person) => <article className="card team-card" key={person.id}><img src={mediaUrl(String(person.imageKey || ""))} alt={String(person.name)} /><div><p className="eyebrow dark">{String(person.title)}</p><h3>{String(person.name)}</h3><p>{String(person.biography)}</p><details><summary>학력·경력·수상 보기</summary>{parseList(person.education).length > 0 && <><b>학력</b><ul>{parseList(person.education).map((line) => <li key={line}>{line}</li>)}</ul></>}{parseList(person.career).length > 0 && <><b>경력</b><ul>{parseList(person.career).map((line) => <li key={line}>{line}</li>)}</ul></>}{parseList(person.awards).length > 0 && <><b>수상</b><ul>{parseList(person.awards).map((line) => <li key={line}>{line}</li>)}</ul></>}</details></div></article>)}</div></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow dark">SPACE</p><h2>시설</h2></div></div><div className="facility-grid">{facilities.map((facility) => <figure key={facility.id}><img src={mediaUrl(String(facility.imageKey))} alt={String(facility.title)} /><figcaption><b>{String(facility.title)}</b><span>{String(facility.description)}</span></figcaption></figure>)}</div></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow dark">NOTICE</p><h2>공지사항</h2></div></div><div className="card notice-detail-list">{notices.map((notice) => <details key={notice.id}><summary><span>{String(notice.category)}</span>{String(notice.title)}</summary><p>{String(notice.content)}</p></details>)}</div></section>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow dark">FAQ</p><h2>자주 묻는 질문</h2></div></div><div className="card faq-list">{faqs.map((faq) => <details key={faq.id}><summary>{String(faq.question)}<span>＋</span></summary><p>{String(faq.answer)}</p></details>)}</div></section>
    <section className="contact-card card"><div><p className="eyebrow dark">VISIT US</p><h2>센터 주소</h2><p>{String(address?.content || "인천 연수구 인천타워대로 301 상가동 2층, CU편의점 맞은편")}</p></div><div className="contact-buttons"><a href="https://www.instagram.com/slowtrain.official" target="_blank" rel="noreferrer">인스타그램 바로가기</a><span>·</span><a href="https://naver.me/Fz8JNnRI" target="_blank" rel="noreferrer">네이버 지도 길찾기</a></div></section>
  </section>;
}
