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

