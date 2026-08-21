import { audit } from "../../../../server/audit";
import { currentUser, requireAdmin } from "../../../../server/auth";
import { many, run } from "../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";
import { newId } from "../../../../server/ids";

export async function GET(request: Request) {
  try {
    const user = await currentUser(request);
    if (user?.role !== "admin") throw new ApiError(403, "관리자 권한이 필요합니다.", "FORBIDDEN");
    return ok({ applications: await many("SELECT id,parent_name AS parentName,phone,child_name AS childName,child_age_group AS childAgeGroup,preferred_date AS preferredDate,note,status,assigned_to AS assignedTo,created_at AS createdAt FROM trial_applications ORDER BY created_at DESC") });
  } catch (error) { return handleApiError(error); }
}

export async function POST(request: Request) {
  try {
    const body = await jsonBody<{ parentName?: string; phone?: string; childName?: string; childAgeGroup?: string; preferredDate?: string; note?: string }>(request), id = newId("trial");
    const parentName = requiredText(body.parentName, "보호자 이름"), phone = requiredText(body.phone, "연락처"), childName = requiredText(body.childName, "자녀 이름"), childAgeGroup = requiredText(body.childAgeGroup, "자녀 연령");
    await run("INSERT INTO trial_applications(id,parent_name,phone,child_name,child_age_group,preferred_date,note) VALUES(?,?,?,?,?,?,?)", id, parentName, phone, childName, childAgeGroup, body.preferredDate?.trim() || null, body.note?.trim() ?? "");
    await audit(request, null, "create", "trial_application", id, null, { parentName, phone, childName, childAgeGroup });
    return ok({ application: { id, parentName, phone, childName, childAgeGroup, preferredDate: body.preferredDate ?? null, note: body.note ?? "", status: "new" } }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
