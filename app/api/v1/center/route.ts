import { audit } from "../../../../server/audit";
import { requireAdmin } from "../../../../server/auth";
import { many, one, run } from "../../../../server/database";
import { handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";

export async function GET() {
  try { return ok({ sections: await many("SELECT key,title,content,updated_at AS updatedAt FROM center_content ORDER BY key") }); }
  catch (error) { return handleApiError(error); }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireAdmin(request), body = await jsonBody<{ key?: string; title?: string; content?: string }>(request);
    const key = requiredText(body.key, "구역 키"), title = requiredText(body.title, "제목"), content = requiredText(body.content, "내용"), before = await one("SELECT key,title,content FROM center_content WHERE key=?", key);
    await run("INSERT INTO center_content(key,title,content,updated_by,updated_at) VALUES(?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET title=excluded.title,content=excluded.content,updated_by=excluded.updated_by,updated_at=CURRENT_TIMESTAMP", key, title, content, actor.id);
    await audit(request, actor, before ? "update" : "create", "center_content", key, before, { key, title, content });
    return ok({ section: { key, title, content } });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const actor = await requireAdmin(request), url = new URL(request.url), key = requiredText(url.searchParams.get("key"), "구역 키"), before = await one("SELECT key,title,content FROM center_content WHERE key=?", key);
    await run("DELETE FROM center_content WHERE key=?", key); await audit(request, actor, "delete", "center_content", key, before, null); return new Response(null, { status: 204 });
  } catch (error) { return handleApiError(error); }
}
