export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "API_ERROR") {
    super(message);
  }
}

export async function jsonBody<T>(request: Request): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new ApiError(415, "JSON 요청만 지원합니다.", "UNSUPPORTED_MEDIA_TYPE");
  }
  try {
    return await request.json() as T;
  } catch {
    throw new ApiError(400, "요청 내용을 확인해주세요.", "INVALID_JSON");
  }
}

export function ok(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function noContent() {
  return new Response(null, { status: 204 });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ error: error.message, code: error.code }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "서버 처리 중 오류가 발생했습니다.", code: "INTERNAL_ERROR" }, { status: 500 });
}

export function requiredText(value: unknown, field: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new ApiError(400, `${field} 항목이 필요합니다.`, "VALIDATION_ERROR");
  return text;
}

export function clientIp(request: Request) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? null;
}
