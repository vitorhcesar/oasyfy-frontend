import { describe, expect, test } from "vitest";
import {
  unwrapAdminTransactionList,
  unwrapPaginatedList,
  unwrapSellerTransactionList,
} from "./api-types";

describe("unwrapPaginatedList", () => {
  test("reads the paginated envelope", () => {
    const result = unwrapPaginatedList({
      items: [{ id: 1 }],
      page: 2,
      limit: 15,
      total: 40,
      totalPages: 3,
    });
    expect(result.items).toEqual([{ id: 1 }]);
    expect(result.total).toBe(40);
    expect(result.page).toBe(2);
  });

  test("falls back to a plain array from older APIs", () => {
    const result = unwrapPaginatedList([{ id: 1 }, { id: 2 }]);
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });
});

describe("unwrapSellerTransactionList", () => {
  test("keeps summary fields", () => {
    const result = unwrapSellerTransactionList({
      items: [],
      page: 1,
      limit: 15,
      total: 0,
      totalPages: 1,
      approvedCount: 4,
      approvedAmount: 1000,
      pendingWithdrawalAmount: 50,
      completedWithdrawalAmount: 200,
    });
    expect(result.approvedCount).toBe(4);
    expect(result.completedWithdrawalAmount).toBe(200);
  });
});

describe("unwrapAdminTransactionList", () => {
  test("keeps stats from the paginated envelope", () => {
    const result = unwrapAdminTransactionList({
      items: [],
      page: 1,
      limit: 20,
      total: 8,
      totalPages: 1,
      stats: {
        paid: { count: 3, amount: 900 },
        pending: { count: 1, amount: 100 },
        failed: { count: 0, amount: 0 },
        chargeback: { count: 0, amount: 0 },
        refunded: { count: 0, amount: 0 },
      },
      statsTotal: 8,
    });
    expect(result.stats.paid.count).toBe(3);
    expect(result.statsTotal).toBe(8);
  });
});
