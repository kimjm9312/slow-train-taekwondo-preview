import { run } from "./database";
import type { AuthUser } from "./auth";
import { clientIp } from "./http";
import { newId } from "./ids";

export async function audit(request: Request, actor: AuthUser | null, action: string, resource: string, resourceId: string | null, before: unknown = null, after: unknown = null) {
  await run(
    "INSERT INTO audit_logs(id,actor_id,action,resource,resource_id,before_json,after_json,ip_address) VALUES(?,?,?,?,?,?,?,?)",
    newId("log"), actor?.id ?? null, action, resource, resourceId,
    before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after), clientIp(request),
  );
}
