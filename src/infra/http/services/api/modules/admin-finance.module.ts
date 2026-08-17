import {
  compactQueryParams,
  type IAdminTransactionListStatsDto,
  type IApiEnvelope,
  type IListAdminTransactionsDto,
  unwrapAdminTransactionList,
} from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IAdminTransactionDto {
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
  createdAt: string;
  updatedAt: string;
}

export interface IAdminWithdrawalDto extends IAdminTransactionDto {
  sellerName: string;
  sellerEmail: string;
  pixKey: string;
}

export interface IAdminTransactionSellerInfoDto {
  fullName: string | null;
  accountId: string;
  email: string | null;
  cpf: string | null;
  cnpj: string | null;
}

export interface IAdminSellerByAccountDto {
  accountId: string;
  fullName: string | null;
  email: string | null;
}

export interface IAdminWithdrawalContextDto {
  withdrawal: IAdminTransactionDto;
  bankData: Record<string, unknown> | null;
  sellerIps: string[];
  balance: number;
  accountId: string;
  cpf: string | null;
  cnpj: string | null;
  withdrawalFee: number;
}

export interface IAdminRefundRequestDto {
  id: number;
  transactionId: number;
  sellerId: number;
  amount: number;
  reason: string;
  status: string;
  adminNote: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  transaction: {
    customerName: string;
    customerEmail: string | null;
    method: string;
    amount: number;
  } | null;
  sellerProfile: {
    fullName: string | null;
    accountId: string;
    email: string | null;
  } | null;
}

export function mapAdminTransactionToView(dto: IAdminTransactionDto) {
  return {
    id: String(dto.id),
    seller_id: dto.sellerId != null ? String(dto.sellerId) : null,
    amount: dto.amount,
    currency: dto.currency,
    status: dto.status,
    method: dto.method,
    customer_name: dto.customerName,
    customer_email: dto.customerEmail,
    description: dto.description,
    metadata: dto.metadata,
    pix_code: dto.pixCode,
    is_locked: dto.isLocked,
    is_fake_refund: dto.isFakeRefund,
    lock_reason: dto.lockReason,
    refund_reason: dto.refundReason,
    acquirer: dto.acquirer,
    fee_amount: dto.feeAmount,
    net_amount: dto.netAmount,
    created_at: dto.createdAt,
    updated_at: dto.updatedAt,
  };
}

export function mapAdminWithdrawalToView(dto: IAdminWithdrawalDto) {
  return {
    ...mapAdminTransactionToView(dto),
    seller_name: dto.sellerName,
    seller_email: dto.sellerEmail,
    pix_key: dto.pixKey,
  };
}

export function mapAdminRefundRequestToView(dto: IAdminRefundRequestDto) {
  return {
    id: String(dto.id),
    transaction_id: String(dto.transactionId),
    seller_id: String(dto.sellerId),
    amount: dto.amount,
    reason: dto.reason,
    status: dto.status as "pending" | "approved" | "rejected",
    admin_note: dto.adminNote,
    reviewed_at: dto.reviewedAt,
    created_at: dto.createdAt,
    transaction: dto.transaction
      ? {
          customer_name: dto.transaction.customerName,
          customer_email: dto.transaction.customerEmail,
          method: dto.transaction.method,
          amount: dto.transaction.amount,
        }
      : undefined,
    seller_profile: dto.sellerProfile
      ? {
          full_name: dto.sellerProfile.fullName,
          account_id: dto.sellerProfile.accountId,
          email: dto.sellerProfile.email,
        }
      : undefined,
  };
}

export interface IListAdminTransactionsParams {
  page?: number;
  limit?: number;
  id?: string;
  customer?: string;
  method?: string;
  acquirer?: string;
  status?: string;
  from?: string;
  to?: string;
}

export interface IListAdminTransactionsResult {
  items: ReturnType<typeof mapAdminTransactionToView>[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  stats: IAdminTransactionListStatsDto;
  statsTotal: number;
}

export interface IAdminFinanceModule {
  listTransactions(
    params?: IListAdminTransactionsParams,
  ): Promise<IListAdminTransactionsResult>;
  getTransactionSellerInfo(
    sellerId: number,
  ): Promise<IAdminTransactionSellerInfoDto | null>;
  getSellersByAccountIds(
    accountIds: string[],
  ): Promise<IAdminSellerByAccountDto[]>;
  refundTransaction(
    transactionId: number,
    body: { reason?: string; isFake: boolean },
  ): Promise<ReturnType<typeof mapAdminTransactionToView>>;
  lockTransaction(
    transactionId: number,
    body: { locked: boolean; lockReason?: string | null },
  ): Promise<ReturnType<typeof mapAdminTransactionToView>>;
  listWithdrawals(): Promise<ReturnType<typeof mapAdminWithdrawalToView>[]>;
  getWithdrawalContext(
    withdrawalId: number,
  ): Promise<IAdminWithdrawalContextDto>;
  approveWithdrawal(
    withdrawalId: number,
    body: {
      type: "manual" | "api";
      feeAmount: number;
      pixKey?: string | null;
      bankName?: string | null;
    },
  ): Promise<void>;
  denyWithdrawal(
    withdrawalId: number,
    body: { reason: string; feeAmount: number },
  ): Promise<void>;
  listRefundRequests(): Promise<
    ReturnType<typeof mapAdminRefundRequestToView>[]
  >;
  reviewRefundRequest(
    refundRequestId: number,
    body: { status: "approved" | "rejected"; adminNote?: string | null },
  ): Promise<void>;
}

export class AdminFinanceModule
  extends BaseApiModule
  implements IAdminFinanceModule
{
  private readonly baseUrl = "/api/v1/admin";

  async listTransactions(params: IListAdminTransactionsParams = {}) {
    const response = await this.getClient().get<
      IApiEnvelope<IListAdminTransactionsDto<IAdminTransactionDto>>
    >(`${this.baseUrl}/transactions`, {
      params: compactQueryParams({
        page: params.page,
        limit: params.limit,
        id: params.id,
        customer: params.customer,
        method: params.method,
        acquirer: params.acquirer,
        status: params.status,
        from: params.from,
        to: params.to,
      }),
    });
    const payload = unwrapAdminTransactionList(response.data);
    return {
      items: payload.items.map(mapAdminTransactionToView),
      page: payload.page,
      limit: payload.limit,
      total: payload.total,
      totalPages: payload.totalPages,
      stats: payload.stats,
      statsTotal: payload.statsTotal,
    };
  }

  async getTransactionSellerInfo(sellerId: number) {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminTransactionSellerInfoDto | null>
    >(`${this.baseUrl}/transactions/seller-info`, {
      params: { sellerId },
    });
    return response.data;
  }

  async getSellersByAccountIds(accountIds: string[]) {
    if (accountIds.length === 0) return [];
    const response = await this.getClient().get<
      IApiEnvelope<IAdminSellerByAccountDto[]>
    >(`${this.baseUrl}/transactions/sellers-by-account`, {
      params: { accountIds: accountIds.join(",") },
    });
    return response.data;
  }

  async refundTransaction(
    transactionId: number,
    body: { reason?: string; isFake: boolean },
  ) {
    const response = await this.getClient().post<
      IApiEnvelope<IAdminTransactionDto>
    >(`${this.baseUrl}/transactions/${transactionId}/refund`, body);
    return mapAdminTransactionToView(response.data);
  }

  async lockTransaction(
    transactionId: number,
    body: { locked: boolean; lockReason?: string | null },
  ) {
    const response = await this.getClient().post<
      IApiEnvelope<IAdminTransactionDto>
    >(`${this.baseUrl}/transactions/${transactionId}/lock`, body);
    return mapAdminTransactionToView(response.data);
  }

  async listWithdrawals() {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminWithdrawalDto[]>
    >(`${this.baseUrl}/withdrawals`);
    return response.data.map(mapAdminWithdrawalToView);
  }

  async getWithdrawalContext(withdrawalId: number) {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminWithdrawalContextDto>
    >(`${this.baseUrl}/withdrawals/${withdrawalId}/context`);
    return response.data;
  }

  async approveWithdrawal(
    withdrawalId: number,
    body: {
      type: "manual" | "api";
      feeAmount: number;
      pixKey?: string | null;
      bankName?: string | null;
    },
  ) {
    await this.getClient().post(
      `${this.baseUrl}/withdrawals/${withdrawalId}/approve`,
      body,
    );
  }

  async denyWithdrawal(
    withdrawalId: number,
    body: { reason: string; feeAmount: number },
  ) {
    await this.getClient().post(
      `${this.baseUrl}/withdrawals/${withdrawalId}/deny`,
      body,
    );
  }

  async listRefundRequests() {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminRefundRequestDto[]>
    >(`${this.baseUrl}/refund-requests`);
    return response.data.map(mapAdminRefundRequestToView);
  }

  async reviewRefundRequest(
    refundRequestId: number,
    body: { status: "approved" | "rejected"; adminNote?: string | null },
  ) {
    await this.getClient().patch(
      `${this.baseUrl}/refund-requests/${refundRequestId}`,
      body,
    );
  }
}
