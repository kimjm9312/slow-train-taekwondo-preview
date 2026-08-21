import { requireAdmin, requireUser } from "../../../../server/auth";
import { media } from "../../../../server/database";
import { ApiError, handleApiError, ok } from "../../../../server/http";
import { newId } from "../../../../server/ids";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const user = await requireUser(request), form = await request.formData() as unknown as { get(name: string): unknown }, file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "업로드할 사진이 필요합니다.", "FILE_REQUIRED");
    if (!allowedTypes.has(file.type)) throw new ApiError(415, "JPG, PNG, WEBP 사진만 등록할 수 있습니다.", "INVALID_FILE_TYPE");
    if (file.size > 8 * 1024 * 1024) throw new ApiError(413, "사진은 8MB 이하여야 합니다.", "FILE_TOO_LARGE");
    const scope = form.get("scope") === "profile" ? `profiles/${user.id}` : `content/${(await requireAdmin(request)).id}`;
    const extension = file.type.split("/")[1].replace("jpeg", "jpg"), key = `${scope}/${newId("img")}.${extension}`;
    await media().put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { uploadedBy: user.id } });
    return ok({ key, url: `/api/v1/media/${encodeURIComponent(key)}` }, { status: 201 });
  } catch (error) { return handleApiError(error); }
}
