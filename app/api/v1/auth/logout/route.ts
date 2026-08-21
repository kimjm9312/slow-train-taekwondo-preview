import { clearSessionCookie, deleteSession } from "../../../../../server/auth";
import { handleApiError, ok } from "../../../../../server/http";

export async function POST(request: Request) {
  try {
    await deleteSession(request);
    return ok({ success: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
  } catch (error) { return handleApiError(error); }
}
