import { audit } from "../../../../../server/audit";
import { ownsChild, requireUser } from "../../../../../server/auth";
import { one, run } from "../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../../server/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request), { id } = await context.params;
    if (!(await ownsChild(user, id))) throw new ApiError(403, "자녀 정보를 수정할 권한이 없습니다.", "FORBIDDEN");
    const body = await jsonBody<{ name?: string; ageGroup?: string; notes?: string; status?: string }>(request);
    const before = await one("SELECT id,name,age_group AS ageGroup,notes,status FROM children WHERE id=?", id);
    if (!before) throw new ApiError(404, "자녀 정보를 찾을 수 없습니다.", "NOT_FOUND");
    const name = requiredText(body.name, "자녀 이름"), ageGroup = requiredText(body.ageGroup, "연령"), notes = body.notes?.trim() ?? "", status = body.status === "inactive" ? "inactive" : "active";
    await run("UPDATE children SET name=?,age_group=?,notes=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", name, ageGroup, notes, status, id);
    await audit(request, user, "update", "child", id, before, { name, ageGroup, notes, status });
    return ok({ child: { id, name, ageGroup, notes, status } });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request), { id } = await context.params;
    if (!(await ownsChild(user, id))) throw new ApiError(403, "자녀 정보를 삭제할 권한이 없습니다.", "FORBIDDEN");
    const before = await one("SELECT id,name,age_group AS ageGroup,status FROM children WHERE id=?", id);
    if (!before) throw new ApiError(404, "자녀 정보를 찾을 수 없습니다.", "NOT_FOUND");
    await run("UPDATE children SET status='inactive',updated_at=CURRENT_TIMESTAMP WHERE id=?", id);
    await audit(request, user, "delete", "child", id, before, { status: "inactive" });
    return ok({ success: true });
  } catch (error) { return handleApiError(error); }
}
