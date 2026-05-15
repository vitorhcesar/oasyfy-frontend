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

export interface ITransactionModule {
  listSellerTransactions: () => Promise<ITransactionDto[]>;
}

export class TransactionModule
  extends BaseApiModule
  implements ITransactionModule
{
  private readonly baseUrl = "/api/v1/transactions";

  async listSellerTransactions(): Promise<ITransactionDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<ITransactionDto[]>
    >(this.baseUrl);
    return response.data;
  }
}
