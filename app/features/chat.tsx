"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, json } from "../lib/api";
import type { User } from "../types";

type Thread = { id: string; parentName?: string; lastMessage?: string; status: string };
type Message = { id: string; senderId: string; senderName: string; message: string; createdAt: string; readAt?: string };

export function ChatFeature({ user, notify }: { user: User; notify: (text: string, tone?: "success" | "error") => void }) {
  const [threads, setThreads] = useState<Thread[]>([]), [activeId, setActiveId] = useState(""), [messages, setMessages] = useState<Message[]>([]);
  const loadThreads = useCallback(async () => { try { const data = await api<{ threads: Thread[] }>("/api/v1/chat/threads"); setThreads(data.threads); setActiveId((current) => current || data.threads[0]?.id || ""); } catch (error) { notify(error instanceof Error ? error.message : "대화를 불러오지 못했습니다.", "error"); } }, [notify]);
  const loadMessages = useCallback(async () => { if (!activeId) return; try { const data = await api<{ messages: Message[] }>(`/api/v1/chat/threads/${activeId}/messages`); setMessages(data.messages); } catch (error) { notify(error instanceof Error ? error.message : "메시지를 불러오지 못했습니다.", "error"); } }, [activeId, notify]);
  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { loadMessages(); }, [loadMessages]);
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget), message = String(form.get("message") || "").trim(); if (!message || !activeId) return; try { await api(`/api/v1/chat/threads/${activeId}/messages`, json("POST", { message })); event.currentTarget.reset(); await loadMessages(); } catch (error) { notify(error instanceof Error ? error.message : "메시지를 보내지 못했습니다.", "error"); } }
  return <section className="page-section chat-page"><header className="feature-header"><div><p className="eyebrow dark">SLOW TRAIN TALK</p><h1>슬로우톡</h1><p>수업과 아이에 관한 이야기를 지도진과 나눠보세요.</p></div></header><div className="chat-shell card">{user.role === "admin" && <aside className="thread-list">{threads.map((thread) => <button key={thread.id} className={activeId === thread.id ? "active" : ""} onClick={() => setActiveId(thread.id)}><b>{thread.parentName}</b><span>{thread.lastMessage || "새 대화"}</span></button>)}</aside>}<div className="conversation"><div className="message-list">{messages.map((message) => <div key={message.id} className={`message ${message.senderId === user.id ? "mine" : "theirs"}`}><small>{message.senderName}</small><p>{message.message}</p><time>{new Date(message.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div>)}{!messages.length && <div className="chat-empty"><b>슬로우톡이 열려 있습니다.</b><p>궁금한 내용을 남겨주시면 확인 후 답변드릴게요.</p></div>}</div><form className="message-form" onSubmit={send}><input name="message" placeholder="메시지를 입력하세요" autoComplete="off" /><button>보내기</button></form></div></div></section>;
}
