import { env } from "cloudflare:workers";

const bindings = env as unknown as { DB?: D1Database; MEDIA?: R2Bucket };

export function d1() {
  if (!bindings.DB) throw new Error("D1 database binding DB is unavailable");
  return bindings.DB;
}

export function media() {
  if (!bindings.MEDIA) throw new Error("R2 media binding MEDIA is unavailable");
  return bindings.MEDIA;
}

export async function one<T>(sql: string, ...values: unknown[]) {
  return d1().prepare(sql).bind(...values).first<T>();
}

export async function many<T>(sql: string, ...values: unknown[]) {
  const result = await d1().prepare(sql).bind(...values).all<T>();
  return result.results;
}

export async function run(sql: string, ...values: unknown[]) {
  return d1().prepare(sql).bind(...values).run();
}
