import { audit } from "../../../../server/audit";
import { ownsChild, requireAdmin, requireUser } from "../../../../server/auth";
import { replaceFixedSchedule } from "../../../../server/booking";
import { many } from "../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";

export async function GET(request: Request) {
  try { const user = await requireUser(request), url = new URL(request.url), childId = requiredText(url.searchParams.get("childId"), "자녀"); if (!(await ownsChild(user, childId))) throw new ApiError(403, "고정수업을 조회할 권한이 없습니다.", "FORBIDDEN"); return ok({ schedules: await many("SELECT id,weekday,start_time AS startTime,active FROM fixed_schedules WHERE child_id=? AND active=1 ORDER BY weekday", childId) }); }
  catch (error) { return handleApiError(error); }
}

export async function PUT(request: Request) {
  try { const actor = await requireAdmin(request), body = await jsonBody<{ childId?: string; times?: Record<string, string> }>(request), childId = requiredText(body.childId, "자녀"), times = body.times ?? {}; const schedules = await replaceFixedSchedule(childId, times); await audit(request, actor, "replace", "fixed_schedule", childId, null, schedules); return ok({ schedules }); }
  catch (error) { return handleApiError(error); }
}
