import { audit } from "../../../../../server/audit";
import { requireUser } from "../../../../../server/auth";
import { cancelReservation } from "../../../../../server/booking";
import { handleApiError, ok } from "../../../../../server/http";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const user = await requireUser(request), { id } = await context.params, result = await cancelReservation(user, id); await audit(request, user, "cancel", "reservation", id, null, result); return ok(result); }
  catch (error) { return handleApiError(error); }
}
