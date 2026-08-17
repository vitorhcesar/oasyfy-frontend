import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IPracaAccessRequestDto,
  IPracaEnabledMemberDto,
  IPracaMessageDto,
  IPracaMessagesPageDto,
} from "./types/praca.types";

export interface IAdminPracaModule {
  listMessages(query?: {
    cursor?: number;
    limit?: number;
  }): Promise<IPracaMessagesPageDto>;
  sendMessage(
    body: string,
    quotedMessageId?: number | null,
  ): Promise<IPracaMessageDto>;
  deleteMessage(messageId: number): Promise<{ ok: true }>;
  listAccessRequests(
    status?: "pending" | "approved" | "rejected",
  ): Promise<IPracaAccessRequestDto[]>;
  approveAccessRequest(
    id: number,
  ): Promise<{ enabled: boolean; emailSent: boolean }>;
  rejectAccessRequest(id: number): Promise<{ status: "rejected" }>;
  listEnabledUsers(): Promise<IPracaEnabledMemberDto[]>;
  purgeUserMessages(sellerId: number): Promise<{ purged: number }>;
}

export class AdminPracaModule
  extends BaseApiModule
  implements IAdminPracaModule
{
  private readonly baseUrl = "/api/v1/admin/praca";

  async listMessages(query?: {
    cursor?: number;
    limit?: number;
  }): Promise<IPracaMessagesPageDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IPracaMessagesPageDto>
    >(`${this.baseUrl}/messages`, { params: query });
    return response.data;
  }

  async sendMessage(
    body: string,
    quotedMessageId?: number | null,
  ): Promise<IPracaMessageDto> {
    const response = await this.getClient().post<IApiEnvelope<IPracaMessageDto>>(
      `${this.baseUrl}/messages`,
      {
        body,
        ...(quotedMessageId != null ? { quotedMessageId } : {}),
      },
    );
    return response.data;
  }

  async deleteMessage(messageId: number): Promise<{ ok: true }> {
    const response = await this.getClient().delete<IApiEnvelope<{ ok: true }>>(
      `${this.baseUrl}/messages/${messageId}`,
    );
    return response.data;
  }

  async listAccessRequests(
    status: "pending" | "approved" | "rejected" = "pending",
  ): Promise<IPracaAccessRequestDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<IPracaAccessRequestDto[]>
    >(`${this.baseUrl}/access-requests`, { params: { status } });
    return response.data;
  }

  async approveAccessRequest(
    id: number,
  ): Promise<{ enabled: boolean; emailSent: boolean }> {
    const response = await this.getClient().post<
      IApiEnvelope<{ enabled: boolean; emailSent: boolean }>
    >(`${this.baseUrl}/access-requests/${id}/approve`);
    return response.data;
  }

  async rejectAccessRequest(id: number): Promise<{ status: "rejected" }> {
    const response = await this.getClient().post<
      IApiEnvelope<{ status: "rejected" }>
    >(`${this.baseUrl}/access-requests/${id}/reject`);
    return response.data;
  }

  async listEnabledUsers(): Promise<IPracaEnabledMemberDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<IPracaEnabledMemberDto[]>
    >(`${this.baseUrl}/users`);
    return response.data;
  }

  async purgeUserMessages(sellerId: number): Promise<{ purged: number }> {
    const response = await this.getClient().delete<
      IApiEnvelope<{ purged: number }>
    >(`${this.baseUrl}/users/${sellerId}/messages`);
    return response.data;
  }
}
