"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminFeature } from "./features/admin";
import { AuthScreen } from "./features/auth";
import { CenterFeature } from "./features/center";
import { ChatFeature } from "./features/chat";
import { HomeFeature } from "./features/home";
import { ProfileFeature } from "./features/profile";
import { FixedScheduleFeature, MakeupFeature, ScheduleFeature } from "./features/schedule";
import { api } from "./lib/api";
import type { Child, ToastMessage, User } from "./types";

type Page = "home" | "schedule" | "fixed" | "makeup" | "center" | "chat" | "profile" | "admin";

const nav = [
  { page: "home" as Page, label: "홈", icon: "⌂" },
  { page: "schedule" as Page, label: "시간표", icon: "▦" },
  { page: "center" as Page, label: "센터", icon: "◉" },
  { page: "chat" as Page, label: "슬로우톡", icon: "◌" },
  { page: "profile" as Page, label: "내 정보", icon: "○" },
];

export function SlowTrainApp() {
  const [loading, setLoading] = useState(true), [user, setUser] = useState<User | null>(null), [children, setChildren] = useState<Child[]>([]), [selectedChildId, setSelectedChildId] = useState(""), [page, setPage] = useState<Page>("home"), [toasts, setToasts] = useState<ToastMessage[]>([]);
  const child = useMemo(() => children.find((item) => item.id === selectedChildId) || children[0], [children, selectedChildId]);
  const notify = useCallback((text: string, tone: "success" | "error" = "success") => { const id = Date.now() + Math.random(); setToasts((items) => [...items, { id, text, tone }]); window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 3600); }, []);
  const loadSession = useCallback(async () => { try { const result = await api<{ user: User | null; children: Child[] }>("/api/v1/auth/session"); setUser(result.user); setChildren(result.children || []); setSelectedChildId((current) => current || result.children?.[0]?.id || ""); } catch { setUser(null); setChildren([]); } finally { setLoading(false); } }, []);
  useEffect(() => { loadSession(); if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined); }, [loadSession]);
  function authenticated(nextUser: User, nextChildren: Child[]) { setUser(nextUser); setChildren(nextChildren); setSelectedChildId(nextChildren[0]?.id || ""); setPage(nextUser.role === "admin" ? "admin" : "home"); }
  function logout() { setUser(null); setChildren([]); setSelectedChildId(""); setPage("home"); }
  if (loading) return <div className="splash"><div className="brand-mark">slow train</div><span>차근차근 준비하고 있습니다.</span></div>;
  if (!user) return <><AuthScreen onAuthenticated={authenticated} notify={notify} /><ToastStack toasts={toasts} /></>;
  return <div className="app-shell"><header className="topbar"><button className="logo" onClick={() => setPage("home")}>slow train</button><nav className="desktop-nav">{nav.map((item) => <button className={page === item.page ? "active" : ""} key={item.page} onClick={() => setPage(item.page)}>{item.label}</button>)}{user.role === "admin" && <button className={page === "admin" ? "active" : ""} onClick={() => setPage("admin")}>관리자</button>}</nav><div className="account-chip">{children.length > 1 && <select value={child?.id} onChange={(event) => setSelectedChildId(event.target.value)}>{children.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>}<button onClick={() => setPage("profile")}><span>{user.name.slice(0,1)}</span><b>{user.name}</b></button></div></header><main className="content-area">{page === "home" && <HomeFeature user={user} child={child} go={(next) => setPage(next as Page)} notify={notify} />}{page === "schedule" && <ScheduleFeature user={user} child={child} notify={notify} />}{page === "fixed" && <FixedScheduleFeature user={user} child={child} notify={notify} />}{page === "makeup" && <MakeupFeature child={child} notify={notify} />}{page === "center" && <CenterFeature notify={notify} />}{page === "chat" && <ChatFeature user={user} notify={notify} />}{page === "profile" && <ProfileFeature user={user} children={children} notify={notify} onLogout={logout} onUserChanged={setUser} />}{page === "admin" && user.role === "admin" && <AdminFeature notify={notify} />}</main><nav className="bottom-nav">{nav.map((item) => <button className={page === item.page ? "active" : ""} key={item.page} onClick={() => setPage(item.page)}><span>{item.icon}</span>{item.label}</button>)}{user.role === "admin" && <button className={page === "admin" ? "active" : ""} onClick={() => setPage("admin")}><span>⚙</span>관리자</button>}</nav><ToastStack toasts={toasts} /></div>;
}

function ToastStack({ toasts }: { toasts: ToastMessage[] }) { return <div className="toast-stack" aria-live="polite">{toasts.map((toast) => <div className={`toast ${toast.tone}`} key={toast.id}>{toast.text}</div>)}</div>; }
