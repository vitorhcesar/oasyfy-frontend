import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IEmailModule {
  sendApprovalEmail: (sellerEmail: string, sellerName: string) => Promise<void>;
  testConnection: (to: string) => Promise<void>;
}

export class EmailModule extends BaseApiModule implements IEmailModule {
  private readonly baseUrl = "/api/v1/email";

  async sendApprovalEmail(
    sellerEmail: string,
    sellerName: string,
  ): Promise<void> {
    await this.getClient().post<IApiEnvelope<void>>(
      `${this.baseUrl}/approval`,
      {
        sellerEmail,
        sellerName,
      },
    );
  }

  async testConnection(to: string): Promise<void> {
    await this.getClient().post<IApiEnvelope<{ sent: boolean; to: string }>>(
      `${this.baseUrl}/connection/test`,
      { to },
    );
  }
}
