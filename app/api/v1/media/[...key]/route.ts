import { media } from "../../../../../server/database";
import { handleApiError } from "../../../../../server/http";

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await context.params, object = await media().get(key.join("/"));
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("Cache-Control", "public, max-age=86400");
    return new Response(object.body, { headers });
  } catch (error) { return handleApiError(error); }
}
