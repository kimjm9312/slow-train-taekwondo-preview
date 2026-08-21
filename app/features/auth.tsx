"use client";

import { FormEvent, useState } from "react";
import { api, json } from "../lib/api";
import type { Child, User } from "../types";

export function AuthScreen({ onAuthenticated, notify }: { onAuthenticated: (user: User, children: Child[]) => void; notify: (text: string, tone?: "success" | "error") => void }) {
  const [mode, setMode] = useState<"login" | "signup" | "trial">("login");
  const [busy, setBusy] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const [developmentCode, setDevelopmentCode] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/v1/auth/login", json("POST", { username: form.get("username"), password: form.get("password") }));
      const session = await api<{ user: User; children: Child[] }>("/api/v1/auth/session");
      onAuthenticated(session.user, session.children); notify("로그인되었습니다.");
    } catch (error) { notify(error instanceof Error ? error.message : "로그인에 실패했습니다.", "error"); }
    finally { setBusy(false); }
  }

  async function signup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || ""), confirm = String(form.get("confirm") || "");
    if (password !== confirm) { notify("비밀번호 확인이 일치하지 않습니다.", "error"); setBusy(false); return; }
    try {
      await api("/api/v1/auth/signup", json("POST", {
        username: form.get("username"), password, name: form.get("name"), phone: form.get("phone"),
        childName: form.get("childName"), ageGroup: form.get("ageGroup"), verificationId,
      }));
      notify("회원가입이 완료되었습니다. 로그인해주세요."); setMode("login");
    } catch (error) { notify(error instanceof Error ? error.message : "회원가입에 실패했습니다.", "error"); }
    finally { setBusy(false); }
  }

  async function trial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget);
    try {
      await api("/api/v1/trials", json("POST", Object.fromEntries(form)));
      notify("상담 및 체험수업 신청이 접수되었습니다."); event.currentTarget.reset(); setMode("login");
    } catch (error) { notify(error instanceof Error ? error.message : "신청을 접수하지 못했습니다.", "error"); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-brand">
      <p className="eyebrow">SLOW TRAIN TAEKWONDO</p>
      <h1>더 나은 내일을 향한<br />아이만의 여정</h1>
      <p>우리는 지나치는 역이 없습니다.<br />발달장애인의 성장과 사회적 연결을 위해 달립니다.</p>
    </section>
    <section className="auth-panel card">
      <div className="segmented">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>로그인</button>
        <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>회원가입</button>
        <button className={mode === "trial" ? "active" : ""} onClick={() => setMode("trial")}>상담·체험</button>
      </div>
      {mode === "login" && <form onSubmit={login} className="stack-form">
        <label>아이디<input name="username" autoComplete="username" defaultValue="slowtrain_parent" required /></label>
        <label>비밀번호<input name="password" type="password" autoComplete="current-password" defaultValue="1234" required /></label>
        <button className="primary" disabled={busy}>{busy ? "확인 중…" : "로그인"}</button>
        <p className="form-note">일반회원 slowtrain_parent / 1234<br />관리자 admin / 1234</p>
      </form>}
      {mode === "signup" && <form onSubmit={signup} className="stack-form">
        <label>아이디<div className="inline-field"><input name="username" required /><button type="button" onClick={async (event) => { const input = event.currentTarget.parentElement?.querySelector("input"); if (!input?.value) return notify("아이디를 입력해주세요.", "error"); try { const result = await api<{ available: boolean }>("/api/v1/auth/check-id", json("POST", { username: input.value })); notify(result.available ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다.", result.available ? "success" : "error"); } catch (error) { notify(error instanceof Error ? error.message : "확인할 수 없습니다.", "error"); } }}>중복확인</button></div></label>
        <label>비밀번호<input name="password" type="password" required /></label>
        <label>비밀번호 확인<input name="confirm" type="password" required /></label>
        <label>보호자 이름<input name="name" required /></label>
        <label>휴대전화<div className="inline-field"><input name="phone" inputMode="tel" required onChange={() => setPhoneVerified(false)} /><button type="button" onClick={async (event) => { const input = event.currentTarget.parentElement?.querySelector("input"); if (!input?.value) return notify("휴대전화를 입력해주세요.", "error"); try { const result = await api<{ verificationId: string; developmentCode?: string }>("/api/v1/auth/phone/request", json("POST", { phone: input.value })); setVerificationId(result.verificationId); setDevelopmentCode(result.developmentCode || ""); notify("인증번호를 발송했습니다."); } catch (error) { notify(error instanceof Error ? error.message : "인증번호를 발송하지 못했습니다.", "error"); } }}>본인인증</button></div></label>
        {verificationId && <label>인증번호<div className="inline-field"><input name="verificationCode" inputMode="numeric" placeholder={developmentCode ? `검수용 ${developmentCode}` : "6자리"} /><button type="button" onClick={async (event) => { const input = event.currentTarget.parentElement?.querySelector("input"); try { await api("/api/v1/auth/phone/confirm", json("POST", { verificationId, code: input?.value })); setPhoneVerified(true); notify("본인인증이 완료되었습니다."); } catch (error) { notify(error instanceof Error ? error.message : "인증에 실패했습니다.", "error"); } }}>확인</button></div></label>}
        <label>자녀 이름<input name="childName" required /></label>
        <label>자녀 연령<select name="ageGroup" required><option>초등 1·2학년</option><option>초등 3·4학년</option><option>초등 5·6학년</option><option>중학생</option><option>고등학생</option><option>성인</option></select></label>
        <button className="primary" disabled={busy || !phoneVerified}>회원가입</button>
      </form>}
      {mode === "trial" && <form onSubmit={trial} className="stack-form">
        <label>보호자 이름<input name="parentName" required /></label>
        <label>연락처<input name="phone" inputMode="tel" required /></label>
        <label>자녀 이름<input name="childName" required /></label>
        <label>자녀 연령<select name="childAgeGroup" required><option>초등 1·2학년</option><option>초등 3·4학년</option><option>초등 5·6학년</option><option>중학생</option><option>고등학생</option><option>성인</option></select></label>
        <label>희망일<input name="preferredDate" type="date" /></label>
        <label>문의 내용<textarea name="note" rows={3} /></label>
        <button className="primary" disabled={busy}>상담 및 체험수업 신청</button>
      </form>}
    </section>
  </main>;
}
