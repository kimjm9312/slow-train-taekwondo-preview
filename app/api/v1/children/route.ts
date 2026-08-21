import { audit } from "../../../../server/audit";
import { requireUser } from "../../../../server/auth";
import { many, run } from "../../../../server/database";
import { handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";
import { newId } from "../../../../server/ids";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const rows = user.role === "admin"
      ? await many("SELECT c.id,c.name,c.age_group AS ageGroup,c.notes,c.status,u.name AS parentName,u.phone FROM children c JOIN users u ON u.id=c.parent_id ORDER BY c.created_at DESC")
      : await many("SELECT id,name,age_group AS ageGroup,notes,status FROM children WHERE parent_id=? ORDER BY created_at DESC", user.id);
    return ok({ children: rows });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await jsonBody<{ name?: string; ageGroup?: string; notes?: string; parentId?: string }>(request);
    const id = newId("child"), parentId = user.role === "admin" && body.parentId ? body.parentId : user.id;
    const name = requiredText(body.name, "자녀 이름"), ageGroup = requiredText(body.ageGroup, "연령");
    await run("INSERT INTO children(id,parent_id,name,age_group,notes) VALUES(?,?,?,?,?)", id, parentId, name, ageGroup, body.notes?.trim() ?? "");
    await audit(request, user, "create", "child", id, null, { parentId, name, ageGroup });
    return ok({ child: { id, parentId, name, ageGroup, notes: body.notes?.trim() ?? "", status: "active" } }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
