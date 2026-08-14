import { Transaction } from "@/domain/entities/transaction.entity";

export interface ISellerRevenueChartPoint {
  date: string;
  amount: number;
  count: number;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function eachLocalDayInclusive(rangeStart: Date, rangeEnd: Date): Date[] {
  const start = startOfLocalDay(rangeStart);
  const end = startOfLocalDay(rangeEnd);
  const days: Date[] = [];

  for (
    const cursor = new Date(start);
    cursor.getTime() <= end.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    days.push(new Date(cursor));
  }

  return days.length > 0 ? days : [start];
}

function isGrossRevenueTransaction(transaction: Transaction): boolean {
  return (
    transaction.isPaid() &&
    transaction.method !== "withdrawal" &&
    transaction.amount > 0
  );
}

export function buildSellerRevenueChartData(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date,
): ISellerRevenueChartPoint[] {
  const revenueTransactions = transactions.filter((transaction) => {
    if (!isGrossRevenueTransaction(transaction)) return false;
    const createdAt = new Date(transaction.createdAt);
    return createdAt >= rangeStart && createdAt <= rangeEnd;
  });

  return eachLocalDayInclusive(rangeStart, rangeEnd).map((dayStart) => {
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayTransactions = revenueTransactions.filter((transaction) => {
      const createdAt = new Date(transaction.createdAt);
      return createdAt >= dayStart && createdAt < dayEnd;
    });

    return {
      date: dayStart.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      amount: dayTransactions.reduce((sum, t) => sum + t.amount, 0) / 100,
      count: dayTransactions.length,
    };
  });
}
