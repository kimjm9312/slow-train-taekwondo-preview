import { requireUser } from "../../../../server/auth";
import { one, run } from "../../../../server/database";
import { handleApiError, jsonBody, ok } from "../../../../server/http";

export async function GET(request: Request) {
  try { const user = await requireUser(request); return ok({ settings: await one("SELECT booking,waitlist,notices,chat,quiet_start AS quietStart,quiet_end AS quietEnd FROM notification_settings WHERE user_id=?", user.id) }); }
  catch (error) { return handleApiError(error); }
}

export async function PUT(request: Request) {
  try { const user = await requireUser(request), body = await jsonBody<{ booking?: boolean; waitlist?: boolean; notices?: boolean; chat?: boolean; quietStart?: string | null; quietEnd?: string | null }>(request); await run(`INSERT INTO notification_settings(user_id,booking,waitlist,notices,chat,quiet_start,quiet_end) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET booking=excluded.booking,waitlist=excluded.waitlist,notices=excluded.notices,chat=excluded.chat,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,updated_at=CURRENT_TIMESTAMP`, user.id, body.booking === false ? 0 : 1, body.waitlist === false ? 0 : 1, body.notices === false ? 0 : 1, body.chat === false ? 0 : 1, body.quietStart ?? null, body.quietEnd ?? null); return ok({ success: true }); }
  catch (error) { return handleApiError(error); }
}
