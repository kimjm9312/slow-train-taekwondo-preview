import { deleteContent, updateContent } from "../../../../../../server/content-crud";
import { handleApiError, noContent, ok } from "../../../../../../server/http";

export async function PATCH(request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  try { const { resource, id } = await context.params; return ok({ item: await updateContent(request, resource, id) }); }
  catch (error) { return handleApiError(error); }
}

export async function DELETE(request: Request, context: { params: Promise<{ resource: string; id: string }> }) {
  try { const { resource, id } = await context.params; await deleteContent(request, resource, id); return noContent(); }
  catch (error) { return handleApiError(error); }
}
