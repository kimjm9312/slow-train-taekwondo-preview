import { audit } from "../../../../server/audit";
import { hashPassword, requireUser, verifyPassword } from "../../../../server/auth";
import { one, run } from "../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../server/http";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const profile = await one("SELECT id,username,role,name,phone,profile_image_key AS profileImageKey,status,created_at AS createdAt FROM users WHERE id=?", user.id);
    return ok({ profile });
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await jsonBody<{ name?: string; phone?: string; profileImageKey?: string | null }>(request);
    const before = await one<{ name: string; phone: string; profile_image_key: string | null }>("SELECT name,phone,profile_image_key FROM users WHERE id=?", user.id);
    const name = requiredText(body.name, "이름"), phone = requiredText(body.phone, "휴대전화");
    const profileImageKey = Object.hasOwn(body, "profileImageKey") ? body.profileImageKey || null : before?.profile_image_key || null;
    await run("UPDATE users SET name=?,phone=?,profile_image_key=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", name, phone, profileImageKey, user.id);
    await audit(request, user, "update", "profile", user.id, before, { name, phone, profileImageKey });
    return ok({ profile: { ...user, name, phone, profileImageKey } });
  } catch (error) { return handleApiError(error); }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await jsonBody<{ currentPassword?: string; newPassword?: string }>(request);
    const currentPassword = requiredText(body.currentPassword, "현재 비밀번호"), newPassword = requiredText(body.newPassword, "새 비밀번호");
    const row = await one<{ password_hash: string }>("SELECT password_hash FROM users WHERE id=?", user.id);
    if (!row || !(await verifyPassword(currentPassword, row.password_hash))) throw new ApiError(400, "현재 비밀번호가 일치하지 않습니다.", "INVALID_PASSWORD");
    await run("UPDATE users SET password_hash=?,updated_at=CURRENT_TIMESTAMP WHERE id=?", await hashPassword(newPassword), user.id);
    await audit(request, user, "password_change", "profile", user.id);
    return ok({ success: true });
  } catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireUser(request);
    if (user.role === "admin") throw new ApiError(400, "대표 관리자 계정은 탈퇴할 수 없습니다.", "PROTECTED_ACCOUNT");
    await run("UPDATE users SET status='withdrawn',updated_at=CURRENT_TIMESTAMP WHERE id=?", user.id);
    await run("DELETE FROM auth_sessions WHERE user_id=?", user.id);
    await audit(request, user, "withdraw", "user", user.id);
    return ok({ success: true });
  } catch (error) { return handleApiError(error); }
}
