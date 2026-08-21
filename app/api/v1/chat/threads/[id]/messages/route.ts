import { audit } from "../../../../../../../server/audit";
import { requireUser } from "../../../../../../../server/auth";
import { many, one, run } from "../../../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../../../../server/http";
import { newId } from "../../../../../../../server/ids";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const user = await requireUser(request), { id } = await context.params, thread = await one<{ parent_id: string }>("SELECT parent_id FROM chat_threads WHERE id=?", id); if (!thread) throw new ApiError(404, "대화방을 찾을 수 없습니다.", "NOT_FOUND"); if (user.role !== "admin" && thread.parent_id !== user.id) throw new ApiError(403, "대화방을 조회할 권한이 없습니다.", "FORBIDDEN"); await run("UPDATE chat_messages SET read_at=CURRENT_TIMESTAMP WHERE thread_id=? AND sender_id<>? AND read_at IS NULL", id, user.id); return ok({ messages: await many(`SELECT m.id,m.sender_id AS senderId,u.name AS senderName,m.message,m.read_at AS readAt,m.created_at AS createdAt FROM chat_messages m JOIN users u ON u.id=m.sender_id WHERE m.thread_id=? ORDER BY m.created_at`, id) }); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const user = await requireUser(request), { id: threadId } = await context.params, body = await jsonBody<{ message?: string }>(request), message = requiredText(body.message, "메시지"), thread = await one<{ parent_id: string; status: string }>("SELECT parent_id,status FROM chat_threads WHERE id=?", threadId); if (!thread) throw new ApiError(404, "대화방을 찾을 수 없습니다.", "NOT_FOUND"); if (user.role !== "admin" && thread.parent_id !== user.id) throw new ApiError(403, "메시지를 보낼 권한이 없습니다.", "FORBIDDEN"); if (thread.status !== "open") throw new ApiError(409, "종료된 대화방입니다.", "THREAD_CLOSED"); const id = newId("message"); await run("INSERT INTO chat_messages(id,thread_id,sender_id,message) VALUES(?,?,?,?)", id, threadId, user.id, message); await run("UPDATE chat_threads SET last_message_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?", threadId); await audit(request, user, "create", "chat_message", id, null, { threadId }); return ok({ message: { id, threadId, senderId: user.id, senderName: user.name, message } }, { status: 201 }); }
  catch (error) { return handleApiError(error); }
}
