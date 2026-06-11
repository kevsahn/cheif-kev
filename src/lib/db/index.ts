import { drizzle as drizzleNeon, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

// 有 DATABASE_URL（Vercel + Neon）走 serverless Postgres；
// 本地没配则退回 PGlite 文件数据库（./.pglite），clone 下来零配置就能跑。
async function createDb(): Promise<Db> {
  if (process.env.DATABASE_URL) {
    return drizzleNeon(neon(process.env.DATABASE_URL), { schema });
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle: drizzlePglite } = await import("drizzle-orm/pglite");
  const g = globalThis as unknown as { __pglite?: InstanceType<typeof PGlite> };
  g.__pglite ??= new PGlite("./.pglite");
  // PGlite 与 Neon 的 drizzle 实例查询 API 一致，统一按 Neon 类型对外
  return drizzlePglite(g.__pglite, { schema }) as unknown as Db;
}

const g = globalThis as unknown as { __dbPromise?: Promise<Db> };

export function getDb(): Promise<Db> {
  return (g.__dbPromise ??= createDb());
}
