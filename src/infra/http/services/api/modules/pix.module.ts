import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  ICartwaveCreatePixBody,
  ICartwavePixResponse,
  TPixSearchTransactionRow,
} from "./types/pix.types";

export interface IPixModule {
  searchTransactions: (pixCode: string) => Promise<TPixSearchTransactionRow[]>;
  createCartwavePix: (
    body: ICartwaveCreatePixBody,
  ) => Promise<ICartwavePixResponse>;
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

  async createCartwavePix(
    body: ICartwaveCreatePixBody,
  ): Promise<ICartwavePixResponse> {
    return this.getClient().post<ICartwavePixResponse>(
      `${this.baseUrl}/cartwave/create`,
      body,
    );
  }
}
