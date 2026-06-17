import { Transaction } from "@/domain/entities/transaction.entity";
import { IApiEnvelope } from "../api-types";
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
  createdAt: Date;
  updatedAt: Date;
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
      metadata: dto.metadata,
      pixCode: dto.pixCode,
      isLocked: dto.isLocked,
      isFakeRefund: dto.isFakeRefund,
      lockReason: dto.lockReason,
      refundReason: dto.refundReason,
      acquirer: dto.acquirer,
      feeAmount: dto.feeAmount,
      netAmount: dto.netAmount,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}

interface IInsertAdjustmentTransactionBody {
  sellerId: number;
  amount: number;
}

export interface ITransactionModule {
  listSellerTransactions: () => Promise<Transaction[]>;
  insertAdjustmentTransaction: (
    data: IInsertAdjustmentTransactionBody,
  ) => Promise<void>;
}

export class TransactionModule
  extends BaseApiModule
  implements ITransactionModule
{
  private readonly baseUrl = "/api/v1/transactions";

  async listSellerTransactions(): Promise<Transaction[]> {
    const response = await this.getClient().get<
      IApiEnvelope<ITransactionDto[]>
    >(this.baseUrl);
    return response.data.map(TransactionMapper.toDomain);
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
