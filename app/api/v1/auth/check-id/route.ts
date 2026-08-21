import { one } from "../../../../../server/database";
import { handleApiError, jsonBody, ok, requiredText } from "../../../../../server/http";

export async function POST(request: Request) {
  try {
    const body = await jsonBody<{ username?: string }>(request);
    const username = requiredText(body.username, "아이디");
    const row = await one("SELECT id FROM users WHERE username=?", username);
    return ok({ available: !row });
  } catch (error) { return handleApiError(error); }
}
