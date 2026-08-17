import { Transaction } from "@/domain/entities/transaction.entity";
import {
  compactQueryParams,
  IApiEnvelope,
  IListSellerTransactionsDto,
  unwrapSellerTransactionList,
} from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface ITransactionDto {
  id: number;
  sellerId: number | null;
  amount: number;
  currency: string;
  status: string;
  method: string;
  customerName: string;
  customerEmail: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  pixCode: string | null;
  isLocked: boolean;
  isFakeRefund: boolean;
  lockReason: string | null;
  refundReason: string | null;
  acquirer: string | null;
  feeAmount: number;
  netAmount: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

interface IInsertAdjustmentTransactionBody {
  sellerId: number;
  amount: number;
}

export class TransactionMapper {
  static toDomain(dto: ITransactionDto): Transaction {
    return Transaction.restore({
      id: dto.id,
      sellerId: dto.sellerId,
      amount: dto.amount,
      currency: dto.currency,
      status: dto.status,
      method: dto.method,
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      description: dto.description,
      metadata: dto.metadata ?? {},
      pixCode: dto.pixCode,
      isLocked: dto.isLocked,
      isFakeRefund: dto.isFakeRefund,
      lockReason: dto.lockReason,
      refundReason: dto.refundReason,
      acquirer: dto.acquirer,
      feeAmount: dto.feeAmount,
      netAmount: dto.netAmount,
      createdAt: toDate(dto.createdAt),
      updatedAt: toDate(dto.updatedAt),
    });
  }
}

export type TSellerTransactionListKind = "sales" | "withdrawals" | "all";

export interface IListSellerTransactionsParams {
  page?: number;
  limit?: number;
  kind?: TSellerTransactionListKind;
  q?: string;
  status?: string;
  method?: string;
  from?: string;
  to?: string;
}

export interface IListSellerTransactionsResult {
  items: Transaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  approvedCount: number;
  approvedAmount: number;
  pendingWithdrawalAmount: number;
  completedWithdrawalAmount: number;
}

export interface ITransactionModule {
  listSellerTransactions: (
    params?: IListSellerTransactionsParams,
  ) => Promise<IListSellerTransactionsResult>;
  insertAdjustmentTransaction: (
    data: IInsertAdjustmentTransactionBody,
  ) => Promise<void>;
}

export class TransactionModule
  extends BaseApiModule
  implements ITransactionModule
{
  private readonly baseUrl = "/api/v1/transactions";

  async listSellerTransactions(
    params: IListSellerTransactionsParams = {},
  ): Promise<IListSellerTransactionsResult> {
    const response = await this.getClient().get<
      IApiEnvelope<IListSellerTransactionsDto<ITransactionDto>>
    >(this.baseUrl, {
      params: compactQueryParams({
        page: params.page,
        limit: params.limit,
        kind: params.kind,
        q: params.q,
        status: params.status,
        method: params.method,
        from: params.from,
        to: params.to,
      }),
    });
    const payload = unwrapSellerTransactionList(response.data);
    return {
      items: payload.items.map(TransactionMapper.toDomain),
      page: payload.page,
      limit: payload.limit,
      total: payload.total,
      totalPages: payload.totalPages,
      approvedCount: payload.approvedCount,
      approvedAmount: payload.approvedAmount,
      pendingWithdrawalAmount: payload.pendingWithdrawalAmount,
      completedWithdrawalAmount: payload.completedWithdrawalAmount,
    };
  }

  async insertAdjustmentTransaction(
    data: IInsertAdjustmentTransactionBody,
  ): Promise<void> {
    const response = await this.getClient().post<IApiEnvelope<void>>(
      `${this.baseUrl}/adjustment`,
      data,
    );
    return response.data;
  }
}
