import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface ISellerNotificationPreferences {
  userId: number;
  accountId: string;
  sale: boolean;
  refund: boolean;
  withdrawal: boolean;
}

export interface ISellerNotificationsModule {
  getVapidPublicKey: () => Promise<{ publicKey: string }>;
  getPreferences: () => Promise<ISellerNotificationPreferences>;
  updatePreferences: (body: {
    sale?: boolean;
    refund?: boolean;
    withdrawal?: boolean;
  }) => Promise<ISellerNotificationPreferences>;
  upsertSubscription: (body: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string | null;
  }) => Promise<{ id: number; endpoint: string }>;
  revokeSubscription: (endpoint: string) => Promise<{ revoked: boolean }>;
}

export class SellerNotificationsModule
  extends BaseApiModule
  implements ISellerNotificationsModule
{
  private readonly baseUrl = "/api/v1/seller/notifications";

  async getVapidPublicKey(): Promise<{ publicKey: string }> {
    const response = await this.getClient().get<
      IApiEnvelope<{ publicKey: string }>
    >(`${this.baseUrl}/vapid-public-key`);
    return response.data;
  }

  async getPreferences(): Promise<ISellerNotificationPreferences> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerNotificationPreferences>
    >(`${this.baseUrl}/preferences`);
    return response.data;
  }

  async updatePreferences(body: {
    sale?: boolean;
    refund?: boolean;
    withdrawal?: boolean;
  }): Promise<ISellerNotificationPreferences> {
    const response = await this.getClient().patch<
      IApiEnvelope<ISellerNotificationPreferences>
    >(`${this.baseUrl}/preferences`, body);
    return response.data;
  }

  async upsertSubscription(body: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    userAgent?: string | null;
  }): Promise<{ id: number; endpoint: string }> {
    const response = await this.getClient().post<
      IApiEnvelope<{ id: number; endpoint: string }>
    >(`${this.baseUrl}/subscriptions`, body);
    return response.data;
  }

  async revokeSubscription(endpoint: string): Promise<{ revoked: boolean }> {
    const response = await this.getClient().delete<
      IApiEnvelope<{ revoked: boolean }>
    >(`${this.baseUrl}/subscriptions`, { data: { endpoint } });
    return response.data;
  }
}
