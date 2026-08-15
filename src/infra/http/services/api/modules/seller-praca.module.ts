import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IPracaAccessDto,
  IPracaMessageDto,
  IPracaMessagesPageDto,
} from "./types/praca.types";

export interface ISellerPracaModule {
  getAccess(): Promise<IPracaAccessDto>;
  requestAccess(): Promise<IPracaAccessDto>;
  listMessages(query?: {
    cursor?: number;
    limit?: number;
  }): Promise<IPracaMessagesPageDto>;
  sendMessage(body: string): Promise<IPracaMessageDto>;
}

export class SellerPracaModule
  extends BaseApiModule
  implements ISellerPracaModule
{
  private readonly baseUrl = "/api/v1/praca";

  async getAccess(): Promise<IPracaAccessDto> {
    const response = await this.getClient().get<IApiEnvelope<IPracaAccessDto>>(
      `${this.baseUrl}/access`,
    );
    return response.data;
  }

  async requestAccess(): Promise<IPracaAccessDto> {
    const response = await this.getClient().post<IApiEnvelope<IPracaAccessDto>>(
      `${this.baseUrl}/access/request`,
    );
    return response.data;
  }

  async listMessages(query?: {
    cursor?: number;
    limit?: number;
  }): Promise<IPracaMessagesPageDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IPracaMessagesPageDto>
    >(`${this.baseUrl}/messages`, { params: query });
    return response.data;
  }

  async sendMessage(body: string): Promise<IPracaMessageDto> {
    const response = await this.getClient().post<IApiEnvelope<IPracaMessageDto>>(
      `${this.baseUrl}/messages`,
      { body },
    );
    return response.data;
  }
}
