import { createSession, sessionCookie, verifyPassword } from "../../../../../server/auth";
import { ensureBootstrap } from "../../../../../server/bootstrap";
import { one } from "../../../../../server/database";
import { handleApiError, jsonBody, ok, requiredText } from "../../../../../server/http";

type LoginUser = { id: string; username: string; password_hash: string; role: string; name: string; phone: string; status: string };

export async function POST(request: Request) {
  try {
    await ensureBootstrap();
    const body = await jsonBody<{ username?: string; password?: string }>(request);
    const username = requiredText(body.username, "아이디");
    const password = requiredText(body.password, "비밀번호");
    const user = await one<LoginUser>("SELECT id,username,password_hash,role,name,phone,status FROM users WHERE username=?", username);
    if (!user || user.status !== "active" || !(await verifyPassword(password, user.password_hash))) {
      return Response.json({ error: "아이디 또는 비밀번호가 올바르지 않습니다.", code: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    const session = await createSession(user.id);
    return ok({ user: { id: user.id, username: user.username, role: user.role, name: user.name, phone: user.phone }, sessionToken: session.token, expiresAt: session.expiresAt }, { headers: { "Set-Cookie": sessionCookie(session.token, session.expiresAt) } });
  } catch (error) { return handleApiError(error); }
}
