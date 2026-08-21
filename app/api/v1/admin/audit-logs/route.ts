import { requireAdmin } from "../../../../../server/auth";
import { many } from "../../../../../server/database";
import { handleApiError, ok } from "../../../../../server/http";

export async function GET(request: Request) { try { await requireAdmin(request); const url = new URL(request.url), resource = url.searchParams.get("resource"), rows = resource ? await many("SELECT id,actor_id AS actorId,action,resource,resource_id AS resourceId,before_json AS beforeJson,after_json AS afterJson,created_at AS createdAt FROM audit_logs WHERE resource=? ORDER BY created_at DESC LIMIT 200", resource) : await many("SELECT id,actor_id AS actorId,action,resource,resource_id AS resourceId,before_json AS beforeJson,after_json AS afterJson,created_at AS createdAt FROM audit_logs ORDER BY created_at DESC LIMIT 200"); return ok({ logs: rows }); } catch (error) { return handleApiError(error); } }
