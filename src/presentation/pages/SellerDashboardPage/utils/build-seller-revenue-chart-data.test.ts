import { Transaction } from "@/domain/entities/transaction.entity";
import { describe, expect, it } from "vitest";
import { buildSellerRevenueChartData } from "./build-seller-revenue-chart-data";

function createTransaction(
  overrides: Partial<{
    id: number;
    amount: number;
    status: string;
    method: string;
    feeAmount: number;
    createdAt: Date;
    metadata: Record<string, unknown>;
  }> = {},
) {
  const amount = overrides.amount ?? 10000;
  const createdAt = overrides.createdAt ?? new Date("2026-08-14T16:00:00.000Z");

  return Transaction.restore({
    id: overrides.id ?? 1,
    sellerId: 1,
    amount,
    currency: "BRL",
    status: overrides.status ?? "paid",
    method: overrides.method ?? "pix",
    customerName: "Cliente",
    customerEmail: null,
    description: null,
    metadata: overrides.metadata ?? {},
    pixCode: null,
    isLocked: false,
    isFakeRefund: false,
    lockReason: null,
    refundReason: null,
    acquirer: null,
    feeAmount: overrides.feeAmount ?? 0,
    netAmount: amount - (overrides.feeAmount ?? 0),
    createdAt,
    updatedAt: createdAt,
  });
}

describe("buildSellerRevenueChartData", () => {
  it("sums paid sales and deposits at gross amount and ignores fees and withdrawals", () => {
    const rangeStart = new Date(2026, 7, 14, 0, 0, 0, 0);
    const rangeEnd = new Date(2026, 7, 14, 23, 59, 59, 999);

    const chartData = buildSellerRevenueChartData(
      [
        createTransaction({
          id: 1,
          amount: 10000,
          feeAmount: 185,
          createdAt: new Date(2026, 7, 14, 10, 0, 0),
        }),
        createTransaction({
          id: 2,
          amount: 5000,
          feeAmount: 85,
          createdAt: new Date(2026, 7, 14, 11, 0, 0),
          metadata: { origin: "seller_deposit" },
        }),
        createTransaction({
          id: 3,
          amount: -9815,
          method: "withdrawal",
          status: "completed",
          createdAt: new Date(2026, 7, 14, 12, 0, 0),
        }),
        createTransaction({
          id: 4,
          amount: 8000,
          status: "pending",
          createdAt: new Date(2026, 7, 14, 13, 0, 0),
        }),
      ],
      rangeStart,
      rangeEnd,
    );

    expect(chartData).toHaveLength(1);
    expect(chartData[0]?.amount).toBe(150);
    expect(chartData[0]?.count).toBe(2);
  });

  it("includes the current day when the 7d range starts in the middle of a day", () => {
    const rangeEnd = new Date(2026, 7, 14, 13, 47, 0);
    const rangeStart = new Date(rangeEnd.getTime() - 7 * 86400000);

    const chartData = buildSellerRevenueChartData(
      [
        createTransaction({
          id: 1,
          amount: 4000,
          createdAt: new Date(2026, 7, 14, 10, 0, 0),
        }),
      ],
      rangeStart,
      rangeEnd,
    );

    expect(chartData.length).toBe(8);
    expect(chartData[chartData.length - 1]?.amount).toBe(40);
    expect(chartData.reduce((sum, point) => sum + point.amount, 0)).toBe(40);
  });
});
