/**
 * UI sandbox: in-memory sample data only.
 * This file never opens a database connection.
 */
import { sampleStores } from "@/lib/sample-data";

type Row = Record<string, unknown>;

function matchWhere(row: Row, where: unknown): boolean {
  if (!where || typeof where !== "object") return true;
  const clause = where as Record<string, unknown>;
  if (Array.isArray(clause.OR)) {
    return clause.OR.some((part) => matchWhere(row, part));
  }
  if (Array.isArray(clause.AND)) {
    return clause.AND.every((part) => matchWhere(row, part));
  }
  if (clause.NOT) return !matchWhere(row, clause.NOT);

  for (const [key, expected] of Object.entries(clause)) {
    if (key === "OR" || key === "AND" || key === "NOT") continue;
    const actual = row[key];
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      const op = expected as Record<string, unknown>;
      if ("equals" in op && actual !== op.equals) return false;
      if ("in" in op && Array.isArray(op.in) && !op.in.includes(actual)) return false;
      if (
        "contains" in op &&
        !String(actual ?? "")
          .toLowerCase()
          .includes(String(op.contains ?? "").toLowerCase())
      ) {
        return false;
      }
      if ("not" in op && actual === op.not) return false;
      continue;
    }
    if (actual !== expected) return false;
  }
  return true;
}

function relatedRows(model: string, row: Row): Row[] | Row | null {
  const studentId = (row.user_id as string) || (row.id as string);
  const store = sampleStores[model];
  if (!store) return null;
  if (model === "students") {
    return store.find((item) => item.user_id === row.id) ?? null;
  }
  if (model === "mentors") {
    return store.find((item) => item.user_id === row.id) ?? null;
  }
  if (model === "university_rankings" || model === "universities") {
    return store.find((item) => item.id === row.university_id) ?? null;
  }
  return store.filter(
    (item) => item.student_id === studentId || item.user_id === row.id,
  );
}

function applyInclude(row: Row, include: unknown): Row {
  if (!include || typeof include !== "object") return { ...row };
  const next = { ...row };
  for (const [key, value] of Object.entries(include as Record<string, unknown>)) {
    if (!value) continue;
    const related = relatedRows(key, row);
    if (value === true) {
      next[key] = related;
      continue;
    }
    if (Array.isArray(related)) {
      next[key] = related.map((item) =>
        applyInclude(item, (value as { include?: unknown }).include),
      );
    } else if (related) {
      next[key] = applyInclude(
        related,
        (value as { include?: unknown }).include,
      );
    } else {
      next[key] = null;
    }
  }
  return next;
}

function storeFor(model: string): Row[] {
  if (!sampleStores[model]) sampleStores[model] = [];
  return sampleStores[model];
}

function modelApi(model: string) {
  const rows = () => storeFor(model);
  return {
    findMany: async (args: { where?: unknown; include?: unknown; take?: number; skip?: number; orderBy?: unknown } = {}) => {
      let list = rows().filter((row) => matchWhere(row, args.where));
      const skip = args.skip ?? 0;
      const take = args.take ?? list.length;
      list = list.slice(skip, skip + take);
      return list.map((row) => applyInclude(row, args.include));
    },
    findFirst: async (args: { where?: unknown; include?: unknown } = {}) => {
      const found = rows().find((row) => matchWhere(row, args.where));
      return found ? applyInclude(found, args.include) : null;
    },
    findUnique: async (args: { where?: unknown; include?: unknown } = {}) => {
      const found = rows().find((row) => matchWhere(row, args.where));
      return found ? applyInclude(found, args.include) : null;
    },
    count: async (args: { where?: unknown } = {}) =>
      rows().filter((row) => matchWhere(row, args.where)).length,
    create: async ({ data }: { data: Row }) => {
      const created = {
        id: data.id ?? crypto.randomUUID(),
        created_at: new Date(),
        updated_at: new Date(),
        ...data,
      };
      rows().push(created);
      return created;
    },
    createMany: async ({ data }: { data: Row[] }) => {
      data.forEach((item) => rows().push({ ...item }));
      return { count: data.length };
    },
    update: async ({ where, data }: { where?: unknown; data: Row }) => {
      const index = rows().findIndex((row) => matchWhere(row, where));
      if (index < 0) return data;
      rows()[index] = { ...rows()[index], ...data };
      return rows()[index];
    },
    updateMany: async ({ where, data }: { where?: unknown; data: Row }) => {
      let count = 0;
      rows().forEach((row, index) => {
        if (matchWhere(row, where)) {
          rows()[index] = { ...row, ...data };
          count += 1;
        }
      });
      return { count };
    },
    upsert: async ({
      where,
      create,
      update,
    }: {
      where?: unknown;
      create: Row;
      update: Row;
    }) => {
      const index = rows().findIndex((row) => matchWhere(row, where));
      if (index < 0) {
        const created = { id: crypto.randomUUID(), ...create };
        rows().push(created);
        return created;
      }
      rows()[index] = { ...rows()[index], ...update };
      return rows()[index];
    },
    delete: async ({ where }: { where?: unknown }) => {
      const index = rows().findIndex((row) => matchWhere(row, where));
      if (index < 0) return null;
      const [removed] = rows().splice(index, 1);
      return removed;
    },
    deleteMany: async ({ where }: { where?: unknown } = {}) => {
      const before = rows().length;
      const kept = rows().filter((row) => !matchWhere(row, where));
      rows().splice(0, rows().length, ...kept);
      return { count: before - kept.length };
    },
    groupBy: async () => [],
    aggregate: async () => ({ _count: { _all: rows().length } }),
  };
}

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const key = String(prop);
      if (key === "$transaction") {
        return async (input: unknown) => {
          if (typeof input === "function") return input(prisma);
          if (Array.isArray(input)) return Promise.all(input);
          return input;
        };
      }
      if (key === "$queryRaw" || key === "$queryRawUnsafe" || key === "$executeRaw" || key === "$executeRawUnsafe") {
        return async () => [];
      }
      if (key === "$disconnect" || key === "$connect") return async () => undefined;
      if (key === "$extends") return () => prisma;
      if (key.startsWith("$") || key === "then") return undefined;
      return modelApi(key);
    },
  },
) as never;
