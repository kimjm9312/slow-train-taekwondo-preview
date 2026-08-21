import { audit } from "../../../../server/audit";
import { ownsChild, requireAdmin, requireUser } from "../../../../server/auth";
import { many, run } from "../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";
import { endOfMonthIso, newId } from "../../../../server/ids";

export async function GET(request: Request) {
  try { const user = await requireUser(request), url = new URL(request.url), childId = url.searchParams.get("childId"); if (childId && !(await ownsChild(user, childId))) throw new ApiError(403, "보강권을 조회할 권한이 없습니다.", "FORBIDDEN"); const rows = user.role === "admin" && !childId ? await many(`SELECT m.id,m.child_id AS childId,c.name AS childName,m.source_type AS sourceType,m.status,m.expires_at AS expiresAt,m.used_reservation_id AS usedReservationId,m.created_at AS createdAt FROM makeup_tickets m JOIN children c ON c.id=m.child_id ORDER BY m.created_at DESC`) : await many(`SELECT id,child_id AS childId,source_type AS sourceType,status,expires_at AS expiresAt,used_reservation_id AS usedReservationId,created_at AS createdAt FROM makeup_tickets WHERE child_id=? ORDER BY created_at DESC`, childId); return ok({ tickets: rows }); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try { const actor = await requireAdmin(request), body = await jsonBody<{ childId?: string; count?: number; expiresAt?: string; reason?: string }>(request), childId = requiredText(body.childId, "회원"), count = Math.max(1, Math.min(20, Number(body.count ?? 1))), expiresAt = body.expiresAt || endOfMonthIso(), ids = Array.from({ length: count }, () => newId("makeup")); await Promise.all(ids.map((id) => run("INSERT INTO makeup_tickets(id,child_id,source_type,source_id,status,expires_at,issued_by) VALUES(?,?,?,?,?,?,?)", id, childId, "admin", body.reason?.trim() || null, "available", expiresAt, actor.id))); await audit(request, actor, "issue", "makeup_ticket", childId, null, { ids, count, expiresAt, reason: body.reason ?? "" }); return ok({ tickets: ids.map((id) => ({ id, childId, status: "available", expiresAt })) }, { status: 201 }); }
  catch (error) { return handleApiError(error); }
}
