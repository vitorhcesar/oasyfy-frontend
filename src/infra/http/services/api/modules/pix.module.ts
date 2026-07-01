import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  ICartwaveCreatePixBody,
  ICreatePixChargeBody,
  IPixChargeResponse,
  TPixSearchTransactionRow,
} from "./types/pix.types";

export interface IPixModule {
  searchTransactions: (pixCode: string) => Promise<TPixSearchTransactionRow[]>;
  /** Failover Woovi/Cartwave via roteamento admin (POST /pix/woovi/create). */
  createPixCharge: (body: ICreatePixChargeBody) => Promise<IPixChargeResponse>;
  /** @deprecated Prefer createPixCharge */
  createCartwavePix: (body: ICartwaveCreatePixBody) => Promise<IPixChargeResponse>;
}

export class PixModule extends BaseApiModule implements IPixModule {
  private readonly baseUrl = "/api/v1/pix";

  async searchTransactions(
    pixCode: string,
  ): Promise<TPixSearchTransactionRow[]> {
    const response = await this.getClient().get<
      IApiEnvelope<{ transactions: TPixSearchTransactionRow[] }>
    >(`${this.baseUrl}/search`, {
      params: { pix_code: pixCode.trim() },
    });
    return response.data.transactions;
  }

  async createPixCharge(body: ICreatePixChargeBody): Promise<IPixChargeResponse> {
    return this.getClient().post<IPixChargeResponse>(
      `${this.baseUrl}/woovi/create`,
      {
        correlation_id: `seller-deposit-${Date.now()}`,
        amount: body.amount,
        customer_name: body.customer_name,
        ...(body.customer_email ? { customer_email: body.customer_email } : {}),
        ...(body.comment ? { comment: body.comment } : {}),
      },
    );
  }

  async createCartwavePix(
    body: ICartwaveCreatePixBody,
  ): Promise<IPixChargeResponse> {
    return this.getClient().post<IPixChargeResponse>(
      `${this.baseUrl}/cartwave/create`,
      body,
    );
  }
}
