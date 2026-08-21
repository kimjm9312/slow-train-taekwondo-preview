import { currentUser } from "../../../../../server/auth";
import { ensureBootstrap } from "../../../../../server/bootstrap";
import { many } from "../../../../../server/database";
import { handleApiError, ok } from "../../../../../server/http";

export async function GET(request: Request) {
  try {
    await ensureBootstrap();
    const user = await currentUser(request);
    if (!user) return ok({ user: null, children: [] });
    const children = user.role === "admin" ? [] : await many("SELECT id,name,age_group AS ageGroup,notes,status FROM children WHERE parent_id=? AND status='active' ORDER BY created_at", user.id);
    return ok({ user, children });
  } catch (error) { return handleApiError(error); }
}
