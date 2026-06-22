import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IWhatsappWelcomeBody {
  phone: string;
  name?: string | null;
  test?: boolean;
}

export interface IWhatsappModule {
  sendWelcome: (body: IWhatsappWelcomeBody) => Promise<void>;
}

export class WhatsappModule extends BaseApiModule implements IWhatsappModule {
  private readonly baseUrl = "/api/v1/whatsapp";

  async sendWelcome(body: IWhatsappWelcomeBody): Promise<void> {
    await this.getClient().post<IApiEnvelope<{ success: boolean }>>(
      `${this.baseUrl}/welcome`,
      body,
    );
  }
}
