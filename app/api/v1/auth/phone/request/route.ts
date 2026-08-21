import { hashPassword } from "../../../../../../server/auth";
import { run } from "../../../../../../server/database";
import { handleApiError, jsonBody, ok, requiredText } from "../../../../../../server/http";
import { newId } from "../../../../../../server/ids";

export async function POST(request: Request) {
  try {
    const body = await jsonBody<{ phone?: string }>(request);
    const phone = requiredText(body.phone, "휴대전화");
    const id = newId("verify"), code = String(Math.floor(100000 + Math.random() * 900000)), expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    await run("INSERT INTO phone_verifications(id,phone,code_hash,expires_at) VALUES(?,?,?,?)", id, phone, await hashPassword(code), expiresAt);
    // 실제 문자 발송 업체가 연결되기 전에는 개발·검수 환경에서만 코드를 반환합니다.
    return ok({ verificationId: id, expiresAt, developmentCode: code });
  } catch (error) { return handleApiError(error); }
}
