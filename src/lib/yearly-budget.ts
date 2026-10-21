import { Prisma } from "@prisma/client";

export const YEARLY_BUDGET_CURRENCIES = ["USD", "VND"] as const;
export type YearlyBudgetCurrency = (typeof YEARLY_BUDGET_CURRENCIES)[number];

/** Hiển thị trên thẻ hồ sơ / báo cáo */
export function formatYearlyBudgetLabel(
  amount: unknown,
  currency: string | null | undefined,
): string | null {
  if (amount == null || amount === "") return null;
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return null;
  const c =
    (currency && String(currency).trim().toUpperCase()) || ("USD" as const);
  return `${n.toLocaleString("vi-VN")} ${c}`;
}

/**
 * Chuẩn hóa từ PATCH studentInfo: số lưu Decimal, đơn vị USD|VND.
 * @throws Error INVALID_BUDGET_AMOUNT | INVALID_CURRENCY
 */
export function parseYearlyBudgetFromStudentInfo(studentInfo: Record<
  string,
  unknown
>): {
  yearly_budget: Prisma.Decimal | null;
  yearly_budget_currency: string | null;
} {
  const amtRaw = studentInfo.yearly_budget;
  const curRaw = studentInfo.yearly_budget_currency;

  if (amtRaw === undefined || amtRaw === null || amtRaw === "") {
    return { yearly_budget: null, yearly_budget_currency: null };
  }

  let currency: string;
  if (curRaw != null && String(curRaw).trim() !== "") {
    const c = String(curRaw).trim().toUpperCase();
    if (!YEARLY_BUDGET_CURRENCIES.includes(c as YearlyBudgetCurrency)) {
      throw new Error("INVALID_CURRENCY");
    }
    currency = c;
  } else {
    currency = "USD";
  }

  let n: number;
  if (typeof amtRaw === "number" && Number.isFinite(amtRaw)) {
    n = amtRaw;
  } else {
    const s = String(amtRaw).trim().replace(/\s/g, "");
    const normalized = s.replace(/,/g, "");
    n = parseFloat(normalized);
  }

  if (!Number.isFinite(n) || n < 0) {
    throw new Error("INVALID_BUDGET_AMOUNT");
  }

  return {
    yearly_budget: new Prisma.Decimal(n),
    yearly_budget_currency: currency,
  };
}
