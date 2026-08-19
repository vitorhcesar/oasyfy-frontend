import {
  compactQueryParams,
  type IApiEnvelope,
  type IPaginatedListDto,
  unwrapPaginatedList,
} from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IAdminWebhookDeliveryListItemDto {
  id: number;
  delivery_id: string;
  event_id: string;
  event: string;
  source: string;
  status: "pending" | "success" | "failed" | string;
  attempts: number;
  last_status_code: number | null;
  last_error: string | null;
  request_url: string | null;
  endpoint_id: number;
  endpoint_url: string;
  endpoint_scope: string;
  endpoint_is_active: boolean;
  seller_id: number;
  seller_name: string;
  seller_email: string;
  seller_account_id: string | null;
  transaction_id: number | null;
  transaction_status: string | null;
  transaction_amount: number | null;
  transaction_customer_name: string | null;
  test: boolean;
  replay_of_id: number | null;
  next_attempt_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IAdminWebhookDeliveryAttemptDto {
  attempt_number: number;
  request_url: string;
  request_headers: Record<string, string>;
  response_status_code: number | null;
  response_body: string | null;
  response_body_truncated: boolean;
  error: string | null;
  duration_ms: number;
  created_at: string;
}

export interface IAdminWebhookDeliveryDetailDto
  extends IAdminWebhookDeliveryListItemDto {
  payload: Record<string, unknown>;
  request: {
    method: "POST";
    url: string;
    headers: Record<string, string>;
  };
  attempts_log: IAdminWebhookDeliveryAttemptDto[];
  transaction: {
    id: number;
    status: string;
    amount: number;
    currency: string;
    method: string;
    customer_name: string;
    customer_email: string | null;
    created_at: string;
  } | null;
}

export interface IAdminWebhookDeliveryStatsDto {
  pending: number;
  success: number;
  failed: number;
}

export interface IListAdminWebhookDeliveriesDto
  extends IPaginatedListDto<IAdminWebhookDeliveryListItemDto> {
  stats: IAdminWebhookDeliveryStatsDto;
}

export interface IListAdminWebhookDeliveriesParams {
  page?: number;
  limit?: number;
  status?: string;
  source?: string;
  event?: string;
  scope?: string;
  sellerId?: number;
  seller?: string;
  transactionId?: number | string;
  deliveryId?: string;
  url?: string;
  from?: string;
  to?: string;
}

const EMPTY_STATS: IAdminWebhookDeliveryStatsDto = {
  pending: 0,
  success: 0,
  failed: 0,
};

export interface IAdminWebhooksModule {
  listDeliveries(
    params?: IListAdminWebhookDeliveriesParams,
  ): Promise<IListAdminWebhookDeliveriesDto>;
  getDelivery(id: number): Promise<IAdminWebhookDeliveryDetailDto>;
  resendDelivery(id: number): Promise<IAdminWebhookDeliveryListItemDto>;
}

export class AdminWebhooksModule
  extends BaseApiModule
  implements IAdminWebhooksModule
{
  private readonly baseUrl = "/api/v1/admin/webhooks/deliveries";

  async listDeliveries(params: IListAdminWebhookDeliveriesParams = {}) {
    const response = await this.getClient().get<
      IApiEnvelope<IListAdminWebhookDeliveriesDto>
    >(this.baseUrl, {
      params: compactQueryParams({
        page: params.page,
        limit: params.limit,
        status: params.status,
        source: params.source,
        event: params.event,
        scope: params.scope,
        sellerId: params.sellerId,
        seller: params.seller,
        transactionId:
          params.transactionId === undefined
            ? undefined
            : String(params.transactionId),
        deliveryId: params.deliveryId,
        url: params.url,
        from: params.from,
        to: params.to,
      }),
    });
    const payload = unwrapPaginatedList(response.data);
    const stats =
      response.data &&
      typeof response.data === "object" &&
      "stats" in response.data
        ? (response.data as IListAdminWebhookDeliveriesDto).stats
        : EMPTY_STATS;
    return {
      ...payload,
      stats: stats ?? EMPTY_STATS,
    };
  }

  async getDelivery(id: number) {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminWebhookDeliveryDetailDto>
    >(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async resendDelivery(id: number) {
    const response = await this.getClient().post<
      IApiEnvelope<IAdminWebhookDeliveryListItemDto>
    >(`${this.baseUrl}/${id}/resend`);
    return response.data;
  }
}
