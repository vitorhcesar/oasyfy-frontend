/** Formato comum das respostas JSON da API HTTP do backend (`BaseRoute.successResponse`). */
export interface IApiEnvelope<T> {
  status: number;
  message: string;
  data: T;
}

export interface IPaginatedListDto<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IAdminTransactionListStatsDto {
  paid: { count: number; amount: number };
  pending: { count: number; amount: number };
  failed: { count: number; amount: number };
  chargeback: { count: number; amount: number };
  refunded: { count: number; amount: number };
}

export interface IListSellerTransactionsDto<T> extends IPaginatedListDto<T> {
  approvedCount: number;
  approvedAmount: number;
  pendingWithdrawalAmount: number;
  completedWithdrawalAmount: number;
}

export interface IListAdminTransactionsDto<T> extends IPaginatedListDto<T> {
  stats: IAdminTransactionListStatsDto;
  statsTotal: number;
}

export function compactQueryParams(
  params: Record<string, string | number | undefined>,
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string | number] =>
        entry[1] !== undefined && entry[1] !== "" && entry[1] !== "all",
    ),
  );
}

const EMPTY_SELLER_EXTRAS = {
  approvedCount: 0,
  approvedAmount: 0,
  pendingWithdrawalAmount: 0,
  completedWithdrawalAmount: 0,
};

const EMPTY_ADMIN_STATS: IAdminTransactionListStatsDto = {
  paid: { count: 0, amount: 0 },
  pending: { count: 0, amount: 0 },
  failed: { count: 0, amount: 0 },
  chargeback: { count: 0, amount: 0 },
  refunded: { count: 0, amount: 0 },
};

export function unwrapPaginatedList<T>(
  payload: IPaginatedListDto<T> | T[] | null | undefined,
): IPaginatedListDto<T> {
  if (Array.isArray(payload)) {
    return {
      items: payload,
      page: 1,
      limit: Math.max(payload.length, 1),
      total: payload.length,
      totalPages: 1,
    };
  }
  if (payload && Array.isArray(payload.items)) {
    return payload;
  }
  return {
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };
}

export function unwrapSellerTransactionList<T>(
  payload: IListSellerTransactionsDto<T> | T[] | null | undefined,
): IListSellerTransactionsDto<T> {
  const base = unwrapPaginatedList(payload);
  if (payload && !Array.isArray(payload)) {
    return {
      ...base,
      approvedCount: payload.approvedCount ?? 0,
      approvedAmount: payload.approvedAmount ?? 0,
      pendingWithdrawalAmount: payload.pendingWithdrawalAmount ?? 0,
      completedWithdrawalAmount: payload.completedWithdrawalAmount ?? 0,
    };
  }
  return { ...base, ...EMPTY_SELLER_EXTRAS };
}

export function unwrapAdminTransactionList<T>(
  payload: IListAdminTransactionsDto<T> | T[] | null | undefined,
): IListAdminTransactionsDto<T> {
  const base = unwrapPaginatedList(payload);
  if (payload && !Array.isArray(payload)) {
    return {
      ...base,
      stats: payload.stats ?? EMPTY_ADMIN_STATS,
      statsTotal: payload.statsTotal ?? base.total,
    };
  }
  return {
    ...base,
    stats: EMPTY_ADMIN_STATS,
    statsTotal: base.total,
  };
}

