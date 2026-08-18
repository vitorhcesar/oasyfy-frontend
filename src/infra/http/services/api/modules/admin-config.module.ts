import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IAdminCheckoutSettingsDto {
  baseUrl: string;
  isEnabled: boolean;
  showStatusToSellers: boolean;
  healthMessage: string;
  lastHealthStatus: "unknown" | "up" | "down";
  lastHealthCheckedAt: string | null;
  effectiveBaseUrl: string;
  portalFrontendUrl: string;
}

export interface IAdminCheckoutSettingsUpdateBody {
  baseUrl: string;
  isEnabled: boolean;
  showStatusToSellers: boolean;
  healthMessage: string;
}

export interface IAdminCheckoutTestResultDto {
  ok: boolean;
  status: "up" | "down";
  latencyMs: number;
  checkedAt: string;
  detail: string;
  statusCode: number | null;
  probedUrl: string;
  settings: IAdminCheckoutSettingsDto;
}

export interface IAdminFinancialSettingsDto {
  autoWithdrawalEnabled: boolean;
  pixMinAmount: number;
  pixMaxAmount: number;
}

export interface IAdminFinancialSettingsUpdateBody {
  autoWithdrawalEnabled: boolean;
  pixMinAmount: number;
  pixMaxAmount: number;
}

export interface IAdminConfigModule {
  listSellerGoals(): Promise<Record<string, unknown>[]>;
  createSellerGoal(payload: Record<string, unknown>): Promise<void>;
  updateSellerGoal(id: number, payload: Record<string, unknown>): Promise<void>;
  deleteSellerGoal(id: number): Promise<void>;
  toggleSellerGoalActive(id: number, isActive: boolean): Promise<void>;
  getSmtpSettings(): Promise<Record<string, unknown> | null>;
  updateSmtpSettings(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  deleteSmtpSettings(): Promise<void>;
  getCrmSettings(): Promise<Record<string, unknown> | null>;
  updateCrmSettings(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  getCheckoutSettings(): Promise<IAdminCheckoutSettingsDto>;
  updateCheckoutSettings(
    payload: IAdminCheckoutSettingsUpdateBody,
  ): Promise<IAdminCheckoutSettingsDto>;
  testCheckoutDomain(baseUrl?: string | null): Promise<IAdminCheckoutTestResultDto>;
  getFinancialSettings(): Promise<IAdminFinancialSettingsDto>;
  updateFinancialSettings(
    payload: IAdminFinancialSettingsUpdateBody,
  ): Promise<IAdminFinancialSettingsDto>;
  listAcquirerConnections(): Promise<Record<string, unknown>[]>;
  ensureDefaultAcquirerConnections(): Promise<Record<string, unknown>[]>;
  updateAcquirerConnection(
    id: number,
    payload: Record<string, unknown>,
  ): Promise<void>;
  setAcquirerConnectionActive(id: number, isActive: boolean): Promise<void>;
  registerOnlyUpWebhook(id: number): Promise<void>;
  registerOnlyUpCashOutWebhook(id: number): Promise<void>;
  listRoutingRules(): Promise<Record<string, unknown>[]>;
  createRoutingRule(payload: Record<string, unknown>): Promise<void>;
  updateRoutingRule(
    id: number,
    payload: Record<string, unknown>,
  ): Promise<void>;
  deleteRoutingRule(id: number): Promise<void>;
  listAcquirerCosts(): Promise<Record<string, unknown>[]>;
  saveAcquirerCosts(
    acquirerId: number,
    costs: Record<string, unknown>[],
  ): Promise<void>;
}

export class AdminConfigModule
  extends BaseApiModule
  implements IAdminConfigModule
{
  private readonly baseUrl = "/api/v1/admin";

  async listSellerGoals() {
    const response = await this.getClient().get<
      IApiEnvelope<Record<string, unknown>[]>
    >(`${this.baseUrl}/seller-goals`);
    return response.data;
  }

  async createSellerGoal(payload: Record<string, unknown>) {
    await this.getClient().post(`${this.baseUrl}/seller-goals`, {
      title: payload.title,
      description: payload.description,
      goalType: payload.goal_type,
      targetValue: payload.target_value,
      rewardType: payload.reward_type,
      rewardValue: payload.reward_value,
      rewardDescription: payload.reward_description,
      sellerId: payload.seller_id ? Number(payload.seller_id) : null,
      startDate: payload.start_date,
      endDate: payload.end_date,
      isActive: payload.is_active,
    });
  }

  async updateSellerGoal(id: number, payload: Record<string, unknown>) {
    await this.getClient().put(`${this.baseUrl}/seller-goals/${id}`, {
      title: payload.title,
      description: payload.description,
      goalType: payload.goal_type,
      targetValue: payload.target_value,
      rewardType: payload.reward_type,
      rewardValue: payload.reward_value,
      rewardDescription: payload.reward_description,
      sellerId: payload.seller_id ? Number(payload.seller_id) : null,
      startDate: payload.start_date,
      endDate: payload.end_date,
      isActive: payload.is_active,
    });
  }

  async deleteSellerGoal(id: number) {
    await this.getClient().delete(`${this.baseUrl}/seller-goals/${id}`);
  }

  async toggleSellerGoalActive(id: number, isActive: boolean) {
    await this.getClient().patch(`${this.baseUrl}/seller-goals/${id}/active`, {
      isActive,
    });
  }

  async getSmtpSettings() {
    const response = await this.getClient().get<
      IApiEnvelope<Record<string, unknown> | null>
    >(`${this.baseUrl}/smtp-settings`);
    return response.data;
  }

  async updateSmtpSettings(payload: Record<string, unknown>) {
    const response = await this.getClient().put<
      IApiEnvelope<Record<string, unknown>>
    >(`${this.baseUrl}/smtp-settings`, {
      host: payload.host,
      port: payload.port,
      username: payload.username,
      password: payload.password,
      fromEmail: payload.from_email,
      fromName: payload.from_name,
      encryption: payload.encryption,
      isActive: payload.is_active ?? true,
    });
    return response.data;
  }

  async deleteSmtpSettings() {
    await this.getClient().delete(`${this.baseUrl}/smtp-settings`);
  }

  async getCrmSettings() {
    const response = await this.getClient().get<
      IApiEnvelope<Record<string, unknown> | null>
    >(`${this.baseUrl}/crm-settings`);
    return response.data;
  }

  async updateCrmSettings(payload: Record<string, unknown>) {
    const response = await this.getClient().put<
      IApiEnvelope<Record<string, unknown>>
    >(`${this.baseUrl}/crm-settings`, {
      apiUrl: payload.api_url,
      apiToken: payload.api_token,
      instanceName: payload.instance_name,
      welcomeMessage: payload.welcome_message,
      isActive: payload.is_active,
    });
    return response.data;
  }

  async getCheckoutSettings() {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminCheckoutSettingsDto>
    >(`${this.baseUrl}/checkout-settings`);
    return response.data;
  }

  async updateCheckoutSettings(payload: IAdminCheckoutSettingsUpdateBody) {
    const response = await this.getClient().put<
      IApiEnvelope<IAdminCheckoutSettingsDto>
    >(`${this.baseUrl}/checkout-settings`, payload);
    return response.data;
  }

  async testCheckoutDomain(baseUrl?: string | null) {
    const response = await this.getClient().post<
      IApiEnvelope<IAdminCheckoutTestResultDto>
    >(`${this.baseUrl}/checkout-settings/test`, {
      baseUrl: baseUrl ?? null,
    });
    return response.data;
  }

  async getFinancialSettings() {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminFinancialSettingsDto>
    >(`${this.baseUrl}/financial-settings`);
    return response.data;
  }

  async updateFinancialSettings(payload: IAdminFinancialSettingsUpdateBody) {
    const response = await this.getClient().put<
      IApiEnvelope<IAdminFinancialSettingsDto>
    >(`${this.baseUrl}/financial-settings`, payload);
    return response.data;
  }

  async listAcquirerConnections() {
    const response = await this.getClient().get<
      IApiEnvelope<Record<string, unknown>[]>
    >(`${this.baseUrl}/acquirer-connections`);
    return response.data;
  }

  async ensureDefaultAcquirerConnections() {
    const response = await this.getClient().post<
      IApiEnvelope<Record<string, unknown>[]>
    >(`${this.baseUrl}/acquirer-connections/ensure-defaults`);
    return response.data;
  }

  async updateAcquirerConnection(
    id: number,
    payload: Record<string, unknown>,
  ) {
    await this.getClient().put(`${this.baseUrl}/acquirer-connections/${id}`, {
      apiUrl: payload.apiUrl ?? payload.api_url,
      clientId: payload.clientId ?? payload.client_id,
      accessToken: payload.accessToken ?? payload.access_token,
      hmacKey: payload.hmacKey ?? payload.hmac_key,
      branchId: payload.branchId ?? payload.branch_id,
      accountNumber: payload.accountNumber ?? payload.account_number,
      status: payload.status,
      isActive: payload.isActive ?? payload.is_active,
      ...(payload.onlyup ? { onlyup: payload.onlyup } : {}),
    });
  }

  async registerOnlyUpWebhook(id: number) {
    await this.getClient().post(
      `${this.baseUrl}/acquirer-connections/${id}/onlyup-webhook`,
    );
  }

  async registerOnlyUpCashOutWebhook(id: number) {
    await this.getClient().post(
      `${this.baseUrl}/acquirer-connections/${id}/onlyup-cash-out-webhook`,
    );
  }

  async setAcquirerConnectionActive(id: number, isActive: boolean) {
    await this.getClient().patch(
      `${this.baseUrl}/acquirer-connections/${id}/active`,
      { isActive },
    );
  }

  async listRoutingRules() {
    const response = await this.getClient().get<
      IApiEnvelope<Record<string, unknown>[]>
    >(`${this.baseUrl}/gateway-routing-rules`);
    return response.data;
  }

  async createRoutingRule(payload: Record<string, unknown>) {
    await this.getClient().post(`${this.baseUrl}/gateway-routing-rules`, {
      method: payload.method,
      acquirerId: Number(payload.acquirer_id ?? payload.acquirerId),
      priority: payload.priority,
      isActive: payload.is_active ?? payload.isActive ?? true,
      weight: payload.weight ?? 100,
    });
  }

  async updateRoutingRule(id: number, payload: Record<string, unknown>) {
    await this.getClient().patch(
      `${this.baseUrl}/gateway-routing-rules/${id}`,
      {
        ...(payload.is_active !== undefined
          ? { isActive: payload.is_active }
          : {}),
        ...(payload.isActive !== undefined
          ? { isActive: payload.isActive }
          : {}),
        ...(payload.priority !== undefined
          ? { priority: payload.priority }
          : {}),
      },
    );
  }

  async deleteRoutingRule(id: number) {
    await this.getClient().delete(
      `${this.baseUrl}/gateway-routing-rules/${id}`,
    );
  }

  async listAcquirerCosts() {
    const response = await this.getClient().get<
      IApiEnvelope<Record<string, unknown>[]>
    >(`${this.baseUrl}/acquirer-costs`);
    return response.data;
  }

  async saveAcquirerCosts(
    acquirerId: number,
    costs: Record<string, unknown>[],
  ) {
    await this.getClient().put(
      `${this.baseUrl}/acquirer-connections/${acquirerId}/costs`,
      {
        costs: costs.map((cost) => ({
          id: cost.id ? Number(cost.id) : undefined,
          acquirerId: Number(cost.acquirer_id ?? acquirerId),
          operationType: cost.operation_type,
          method: cost.method,
          fixedCost: cost.fixed_cost,
          variableCost: cost.variable_cost,
          minCost: cost.min_cost,
        })),
      },
    );
  }
}
