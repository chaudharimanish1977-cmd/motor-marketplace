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
// Per-table mutex — serializes read-modify-write critical sections
//
// Why this exists: appendRow / updateById / deleteById all do a
// readTable() → mutate locally → writeTable() sequence. Without
// serialization, parallel callers race: each reads the same snapshot,
// each writes back, and only the last writer's mutation survives.
//
// This bit production once the multi-doc audit pipeline started
// running 3+ pipelines in parallel for a single forward — concurrent
// appendRow() calls on PARSED_POLICIES clobbered each other's rows,
// causing one doc per forward to silently disappear from the
// consolidated reply's metadata lookup.
//
// In-memory lock is sufficient for our case: all parallel work in a
// single forward runs inside ONE Vercel function invocation (the
// QStash worker for that forwardId), so a single Node process holds
// all the writes. Cross-instance races (two unrelated forwards
// writing to the same table simultaneously) are still theoretically
// possible but vanishingly rare at current volume; if we hit that we
// move to a Redis-side distributed lock or per-row atomic keys.
// ============================================================================

const _tableLocks: Map<string, Promise<unknown>> = new Map();

async function withTableLock<T>(
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const prev = _tableLocks.get(table) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  // Store next under the same key so the chain serializes; clean up
  // after THIS task finishes so stale promises don't accumulate.
  _tableLocks.set(table, next);
  try {
    return (await next) as T;
  } finally {
    if (_tableLocks.get(table) === next) {
      _tableLocks.delete(table);
    }
  }
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
  // Serialize via per-table mutex — concurrent appendRow calls on the
  // same table used to clobber each other's rows (read-modify-write
  // race). See withTableLock comment above.
  return withTableLock(table, async () => {
    const newRow = { ...row, id: row.id || randomUUID() } as unknown as T;
    const existing = await readTable<T>(table);
    existing.push(newRow);
    await writeTable(table, existing);
    return newRow;
  });
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
  // Same race-window as appendRow — serialize via per-table mutex.
  return withTableLock(table, async () => {
    const all = await readTable<T>(table);
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...patch };
    await writeTable(table, all);
    return all[idx];
  });
}

export async function deleteById<T extends { id: string }>(
  table: string,
  id: string
): Promise<boolean> {
  // Same race-window as appendRow / updateById — serialize.
  return withTableLock(table, async () => {
    const all = await readTable<T>(table);
    const idx = all.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    all.splice(idx, 1);
    await writeTable(table, all);
    return true;
  });
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
  SHARE_TOKENS: "share_tokens",
  /** Pre-computed admin-dashboard snapshot (singleton row, id="latest").
   *  Written by the cron at /api/cron/admin-dashboard and the manual
   *  refresh at /api/admin/dashboard/refresh. Read by /admin/dashboard. */
  ADMIN_DASHBOARD_SNAPSHOTS: "admin_dashboard_snapshots",
} as const;

export const ALL_TABLES = Object.values(Tables);
