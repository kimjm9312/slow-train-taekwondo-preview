import { audit } from "./audit";
import { currentUser, requireAdmin } from "./auth";
import { many, one, run } from "./database";
import { ApiError, jsonBody, requiredText } from "./http";
import { newId } from "./ids";

type Field = { api: string; column: string; required?: boolean; boolean?: boolean; number?: boolean; json?: boolean; defaultValue?: unknown };
type Config = { table: string; prefix: string; fields: Field[]; publicFilter?: string; orderBy: string };

const configs: Record<string, Config> = {
  notices: { table: "notices", prefix: "notice", orderBy: "is_pinned DESC,published_at DESC", fields: [
    { api: "category", column: "category", required: true }, { api: "title", column: "title", required: true }, { api: "content", column: "content", required: true }, { api: "isPinned", column: "is_pinned", boolean: true, defaultValue: false },
  ] },
  faqs: { table: "faqs", prefix: "faq", orderBy: "sort_order,id", publicFilter: "is_visible=1", fields: [
    { api: "question", column: "question", required: true }, { api: "answer", column: "answer", required: true }, { api: "sortOrder", column: "sort_order", number: true, defaultValue: 0 }, { api: "isVisible", column: "is_visible", boolean: true, defaultValue: true },
  ] },
  programs: { table: "programs", prefix: "program", orderBy: "sort_order,id", publicFilter: "is_visible=1", fields: [
    { api: "name", column: "name", required: true }, { api: "summary", column: "summary", required: true }, { api: "description", column: "description", required: true }, { api: "sortOrder", column: "sort_order", number: true, defaultValue: 0 }, { api: "isVisible", column: "is_visible", boolean: true, defaultValue: true },
  ] },
  staff: { table: "staff", prefix: "staff", orderBy: "sort_order,id", publicFilter: "is_visible=1", fields: [
    { api: "name", column: "name", required: true }, { api: "title", column: "title", required: true }, { api: "biography", column: "biography", required: true }, { api: "education", column: "education_json", json: true, defaultValue: [] }, { api: "career", column: "career_json", json: true, defaultValue: [] }, { api: "awards", column: "awards_json", json: true, defaultValue: [] }, { api: "imageKey", column: "image_key" }, { api: "sortOrder", column: "sort_order", number: true, defaultValue: 0 }, { api: "isVisible", column: "is_visible", boolean: true, defaultValue: true },
  ] },
  facilities: { table: "facilities", prefix: "facility", orderBy: "sort_order,id", publicFilter: "is_visible=1", fields: [
    { api: "title", column: "title", required: true }, { api: "description", column: "description" }, { api: "imageKey", column: "image_key", required: true }, { api: "sortOrder", column: "sort_order", number: true, defaultValue: 0 }, { api: "isVisible", column: "is_visible", boolean: true, defaultValue: true },
  ] },
};

function configFor(resource: string) {
  const config = configs[resource];
  if (!config) throw new ApiError(404, "지원하지 않는 자료입니다.", "NOT_FOUND");
  return config;
}

function value(field: Field, input: unknown) {
  if (input === undefined) input = field.defaultValue;
  if (field.required) input = requiredText(input, field.api);
  if (field.boolean) return input === false || input === 0 ? 0 : 1;
  if (field.number) return Number.isFinite(Number(input)) ? Number(input) : 0;
  if (field.json) return JSON.stringify(Array.isArray(input) ? input : []);
  return typeof input === "string" ? input.trim() : input ?? "";
}

function selectColumns(config: Config) {
  return ["id", ...config.fields.map((field) => `${field.column} AS ${field.api}`), "created_at AS createdAt", "updated_at AS updatedAt"].join(",");
}

export async function listContent(request: Request, resource: string) {
  const config = configFor(resource), user = await currentUser(request);
  const where = user?.role === "admin" || !config.publicFilter ? "" : ` WHERE ${config.publicFilter}`;
  return many(`SELECT ${selectColumns(config)} FROM ${config.table}${where} ORDER BY ${config.orderBy}`);
}

export async function createContent(request: Request, resource: string) {
  const actor = await requireAdmin(request), config = configFor(resource), body = await jsonBody<Record<string, unknown>>(request), id = newId(config.prefix);
  const columns = config.fields.map((field) => field.column), values = config.fields.map((field) => value(field, body[field.api]));
  await run(`INSERT INTO ${config.table}(id,${columns.join(",")}) VALUES(${["?", ...columns.map(() => "?")].join(",")})`, id, ...values);
  const row = await one(`SELECT ${selectColumns(config)} FROM ${config.table} WHERE id=?`, id);
  await audit(request, actor, "create", resource, id, null, row);
  return row;
}

export async function updateContent(request: Request, resource: string, id: string) {
  const actor = await requireAdmin(request), config = configFor(resource), body = await jsonBody<Record<string, unknown>>(request);
  const before = await one(`SELECT ${selectColumns(config)} FROM ${config.table} WHERE id=?`, id);
  if (!before) throw new ApiError(404, "자료를 찾을 수 없습니다.", "NOT_FOUND");
  const supplied = config.fields.filter((field) => Object.hasOwn(body, field.api));
  if (!supplied.length) throw new ApiError(400, "수정할 항목이 없습니다.", "NO_CHANGES");
  await run(`UPDATE ${config.table} SET ${supplied.map((field) => `${field.column}=?`).join(",")},updated_at=CURRENT_TIMESTAMP WHERE id=?`, ...supplied.map((field) => value(field, body[field.api])), id);
  const after = await one(`SELECT ${selectColumns(config)} FROM ${config.table} WHERE id=?`, id);
  await audit(request, actor, "update", resource, id, before, after);
  return after;
}

export async function deleteContent(request: Request, resource: string, id: string) {
  const actor = await requireAdmin(request), config = configFor(resource);
  const before = await one(`SELECT ${selectColumns(config)} FROM ${config.table} WHERE id=?`, id);
  if (!before) throw new ApiError(404, "자료를 찾을 수 없습니다.", "NOT_FOUND");
  await run(`DELETE FROM ${config.table} WHERE id=?`, id);
  await audit(request, actor, "delete", resource, id, before, null);
}
