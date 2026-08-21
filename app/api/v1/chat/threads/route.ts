import { requireUser } from "../../../../../server/auth";
import { many, one, run } from "../../../../../server/database";
import { handleApiError, ok } from "../../../../../server/http";
import { newId } from "../../../../../server/ids";

export async function GET(request: Request) {
  try { const user = await requireUser(request); if (user.role === "admin") return ok({ threads: await many(`SELECT t.id,t.parent_id AS parentId,u.name AS parentName,u.phone,t.status,t.last_message_at AS lastMessageAt,(SELECT message FROM chat_messages WHERE thread_id=t.id ORDER BY created_at DESC LIMIT 1) AS lastMessage FROM chat_threads t JOIN users u ON u.id=t.parent_id ORDER BY t.last_message_at DESC`) }); let thread = await one("SELECT id,parent_id AS parentId,status,last_message_at AS lastMessageAt FROM chat_threads WHERE parent_id=?", user.id); if (!thread) { const id = newId("thread"); await run("INSERT INTO chat_threads(id,parent_id) VALUES(?,?)", id, user.id); thread = { id, parentId: user.id, status: "open" }; } return ok({ threads: [thread] }); }
  catch (error) { return handleApiError(error); }
}
