import { createContent, listContent } from "../../../../../server/content-crud";
import { handleApiError, ok } from "../../../../../server/http";

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  try { const { resource } = await context.params; return ok({ items: await listContent(request, resource) }); }
  catch (error) { return handleApiError(error); }
}

export async function POST(request: Request, context: { params: Promise<{ resource: string }> }) {
  try { const { resource } = await context.params; return ok({ item: await createContent(request, resource) }, { status: 201 }); }
  catch (error) { return handleApiError(error); }
}
