/**
 * Storage layer for the prototype. Dual-mode:
 *   - Local dev: JSON files in data/db/ (zero setup, easy debugging).
 *   - Vercel:    Vercel KV (Upstash Redis) when KV_REST_API_URL is present.
 *
 * Each "table" is a single key holding a JSON-serialised array of rows.
 * That mirrors the file model exactly — read full table → mutate → write back.
 * Fine at demo scale; not designed for hot tables in production.
 *
 * The public API stays identical across both backends so callers never branch.
 */

import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { kv } from "@vercel/kv";

const DB_DIR = path.join(process.cwd(), "data", "db");
const KV_KEY_PREFIX = "mm:";

const useKv = !!process.env.KV_REST_API_URL;

async function ensureDbDir() {
  await fs.mkdir(DB_DIR, { recursive: true });
}

// ============================================================================
// Generic CRUD helpers
// ============================================================================

export async function readTable<T>(table: string): Promise<T[]> {
  if (useKv) {
    const data = await kv.get<T[]>(KV_KEY_PREFIX + table);
    return data ?? [];
  }
  await ensureDbDir();
  const file = path.join(DB_DIR, `${table}.json`);
  try {
    const data = await fs.readFile(file, "utf-8");
    return JSON.parse(data) as T[];
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "ENOENT"
    ) {
      return [];
    }
    throw err;
  }
}

export async function writeTable<T>(table: string, data: T[]): Promise<void> {
  if (useKv) {
    await kv.set(KV_KEY_PREFIX + table, data);
    return;
  }
  await ensureDbDir();
  const file = path.join(DB_DIR, `${table}.json`);
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

export async function appendRow<T extends { id: string }>(
  table: string,
  row: Omit<T, "id"> & { id?: string }
): Promise<T> {
  const newRow = { ...row, id: row.id || randomUUID() } as unknown as T;
  const existing = await readTable<T>(table);
  existing.push(newRow);
  await writeTable(table, existing);
  return newRow;
}

export async function findById<T extends { id: string }>(
  table: string,
  id: string
): Promise<T | null> {
  const all = await readTable<T>(table);
  return all.find((r) => r.id === id) ?? null;
}

export async function findOne<T>(
  table: string,
  predicate: (row: T) => boolean
): Promise<T | null> {
  const all = await readTable<T>(table);
  return all.find(predicate) ?? null;
}

export async function findMany<T>(
  table: string,
  predicate: (row: T) => boolean
): Promise<T[]> {
  const all = await readTable<T>(table);
  return all.filter(predicate);
}

export async function updateById<T extends { id: string }>(
  table: string,
  id: string,
  patch: Partial<T>
): Promise<T | null> {
  const all = await readTable<T>(table);
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch };
  await writeTable(table, all);
  return all[idx];
}

export async function deleteById<T extends { id: string }>(
  table: string,
  id: string
): Promise<boolean> {
  const all = await readTable<T>(table);
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  all.splice(idx, 1);
  await writeTable(table, all);
  return true;
}

// ============================================================================
// Table name constants — single source of truth
// ============================================================================

export const Tables = {
  USERS: "users",
  PARSED_POLICIES: "parsed_policies",
  REPORTS: "reports",
  RFQS: "rfqs",
  BIDS: "bids",
  TRANSACTIONS: "transactions",
  RENEWAL_SCHEDULES: "renewal_schedules",
  RENEWAL_SUBSCRIPTIONS: "renewal_subscriptions",
  COMPARISONS: "comparisons",
} as const;

export const ALL_TABLES = Object.values(Tables);
