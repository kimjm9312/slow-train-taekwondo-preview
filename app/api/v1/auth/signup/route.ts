import { audit } from "../../../../../server/audit";
import { createSession, hashPassword, sessionCookie } from "../../../../../server/auth";
import { d1, one } from "../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../../server/http";
import { newId } from "../../../../../server/ids";

export async function POST(request: Request) {
  try {
    const body = await jsonBody<{ username?: string; password?: string; name?: string; phone?: string; childName?: string; ageGroup?: string; verificationId?: string }>(request);
    const username = requiredText(body.username, "아이디"), password = requiredText(body.password, "비밀번호"), name = requiredText(body.name, "보호자 이름"), phone = requiredText(body.phone, "휴대전화"), childName = requiredText(body.childName, "자녀 이름"), ageGroup = requiredText(body.ageGroup, "자녀 연령");
    if (await one("SELECT id FROM users WHERE username=?", username)) throw new ApiError(409, "이미 사용 중인 아이디입니다.", "DUPLICATE_USERNAME");
    const verification = body.verificationId ? await one<{ verified_at: string | null }>("SELECT verified_at FROM phone_verifications WHERE id=? AND phone=? AND expires_at>CURRENT_TIMESTAMP", body.verificationId, phone) : null;
    if (!verification?.verified_at) throw new ApiError(400, "휴대전화 본인인증이 필요합니다.", "PHONE_VERIFICATION_REQUIRED");
    const userId = newId("usr"), childId = newId("child"), passwordHash = await hashPassword(password);
    await d1().batch([
      d1().prepare("INSERT INTO users(id,username,password_hash,role,name,phone) VALUES(?,?,?,?,?,?)").bind(userId, username, passwordHash, "parent", name, phone),
      d1().prepare("INSERT INTO children(id,parent_id,name,age_group,notes) VALUES(?,?,?,?,?)").bind(childId, userId, childName, ageGroup, ""),
      d1().prepare("INSERT INTO notification_settings(user_id) VALUES(?)").bind(userId),
    ]);
    await audit(request, { id: userId, username, role: "parent", name, phone, status: "active" }, "create", "user", userId, null, { username, name, phone, childId });
    const session = await createSession(userId);
    return ok({ user: { id: userId, username, role: "parent", name, phone }, child: { id: childId, name: childName, ageGroup }, sessionToken: session.token, expiresAt: session.expiresAt }, { status: 201, headers: { "Set-Cookie": sessionCookie(session.token, session.expiresAt) } });
  } catch (error) { return handleApiError(error); }
}
