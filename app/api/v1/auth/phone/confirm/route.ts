import { verifyPassword } from "../../../../../../server/auth";
import { one, run } from "../../../../../../server/database";
import { ApiError, handleApiError, jsonBody, ok, requiredText } from "../../../../../../server/http";

export async function POST(request: Request) {
  try {
    const body = await jsonBody<{ verificationId?: string; code?: string }>(request);
    const id = requiredText(body.verificationId, "인증 요청"), code = requiredText(body.code, "인증번호");
    const row = await one<{ code_hash: string; verified_at: string | null }>("SELECT code_hash,verified_at FROM phone_verifications WHERE id=? AND expires_at>CURRENT_TIMESTAMP", id);
    if (!row || !(await verifyPassword(code, row.code_hash))) throw new ApiError(400, "인증번호가 올바르지 않거나 만료되었습니다.", "INVALID_VERIFICATION_CODE");
    await run("UPDATE phone_verifications SET verified_at=CURRENT_TIMESTAMP WHERE id=?", id);
    return ok({ verified: true });
  } catch (error) { return handleApiError(error); }
}
