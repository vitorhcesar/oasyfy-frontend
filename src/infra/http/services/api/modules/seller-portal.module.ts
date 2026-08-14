import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface ISellerProfileDto {
  fullName: string | null;
  displayName: string;
  avatarUrl: string | null;
  accountId: string;
  email: string | null;
  phone: string | null;
  showIdentityInRevenueRanking: boolean;
}

export interface ISellerRevenueRankingEntryDto {
  position: number;
  revenueAmount: number;
  transactionCount: number;
  anonymous: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  isCurrentUser: boolean;
}

export interface ISellerRevenueRankingMeDto {
  position: number | null;
  revenueAmount: number;
  transactionCount: number;
  showIdentityInRevenueRanking: boolean;
}

export interface ISellerRevenueRankingDto {
  range: "today" | "7d" | "30d" | "custom";
  from: string;
  to: string;
  entries: ISellerRevenueRankingEntryDto[];
  me: ISellerRevenueRankingMeDto;
}

export interface ISellerRevenueRankingQueryDto {
  range?: "today" | "7d" | "30d" | "custom";
  rangeStart?: string;
  rangeEnd?: string;
}

export interface ISellerWithdrawalLimitsDto {
  withdrawalMinAmount: number;
  withdrawalMaxAmount: number;
  withdrawalDailyMax: number;
}

export interface ISellerWithdrawalFeeDto {
  withdrawalFixedFee: number;
  withdrawalVariableFee: number;
  withdrawalMinFee: number;
}

export interface ISellerBankAccountDto {
  bankName: string;
  agency: string;
  agencyDigit: string;
  account: string;
  accountDigit: string;
  accountType: string;
  pixKeyType: string;
  pixKey: string;
}

export interface ISellerWithdrawalContextDto {
  bankAccounts: ISellerBankAccountDto[];
  withdrawalsBlocked: boolean;
  withdrawalBlockReason: string | null;
  limits: ISellerWithdrawalLimitsDto;
  fee: ISellerWithdrawalFeeDto;
  dailyWithdrawnTotal: number;
}

export interface ICreateSellerWithdrawalBody {
  amount: number;
  description: string;
  balanceSource: "card" | "pix_boleto";
  pixCode?: string;
  pixKey?: string;
  pixKeyType?: string;
  bankName?: string;
  accountType?: string;
}

export interface ISellerWithdrawalResultDto {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
}

export interface ISellerApiKeyDto {
  id: number;
  name: string;
  apiKey: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ISellerAuthorizedIpDto {
  id: number;
  ipAddress: string;
  createdAt: string;
}

export interface ISellerLoginLogDto {
  id: number;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
}

export interface ISellerPartnerDto {
  id: number;
  owner_id: number;
  partner_id: number;
  percentage: number;
  status: string;
  invited_email: string;
  note: string | null;
  invited_at: string;
  responded_at: string | null;
  expires_at: string;
  role: "owner" | "partner";
  counterparty_name: string | null;
  counterparty_email: string | null;
  counterparty_account_id: string | null;
  total_received_amount?: number;
}

export interface ISellerPartnersListDto {
  owned: ISellerPartnerDto[];
  received: ISellerPartnerDto[];
}

export type TSellerPartnerSearchDto =
  | { found: false }
  | {
      found: true;
      account_id: string;
      display_name: string;
      email_masked: string;
      eligible: boolean;
      ineligible_reason: string | null;
    };

export interface ISellerPortalModule {
  getProfile: () => Promise<ISellerProfileDto>;
  updateProfile: (body: {
    displayName?: string;
    showIdentityInRevenueRanking?: boolean;
  }) => Promise<ISellerProfileDto>;
  uploadAvatar: (file: File) => Promise<{ avatarUrl: string }>;
  getRevenueRanking: (
    query?: ISellerRevenueRankingQueryDto,
  ) => Promise<ISellerRevenueRankingDto>;
  getWithdrawalContext: () => Promise<ISellerWithdrawalContextDto>;
  requestWithdrawal: (
    body: ICreateSellerWithdrawalBody,
  ) => Promise<ISellerWithdrawalResultDto>;
  listApiKeys: () => Promise<ISellerApiKeyDto[]>;
  createApiKey: (body: {
    name: string;
    apiKey: string;
    permissions: string[];
  }) => Promise<ISellerApiKeyDto>;
  deleteApiKey: (id: number) => Promise<void>;
  listAuthorizedIps: () => Promise<ISellerAuthorizedIpDto[]>;
  createAuthorizedIp: (ipAddress: string) => Promise<ISellerAuthorizedIpDto>;
  deleteAuthorizedIp: (id: number) => Promise<void>;
  listLoginLogs: () => Promise<ISellerLoginLogDto[]>;
  deleteLoginLog: (id: number) => Promise<void>;
  searchPartnerByEmail: (email: string) => Promise<TSellerPartnerSearchDto>;
  listPartners: () => Promise<ISellerPartnersListDto>;
  invitePartner: (body: {
    email: string;
    percentage: number;
    note?: string | null;
  }) => Promise<{
    id: number;
    partner_id: number;
    percentage: number;
    status: string;
    invited_email: string;
    expires_at: string;
  }>;
  updatePartner: (
    id: number,
    body: { percentage?: number; action?: "pause" | "resume" | "revoke" },
  ) => Promise<{ id: number; status: string; percentage: number }>;
  acceptPartnerInvite: (
    id: number,
  ) => Promise<{ id: number; status: string; percentage: number }>;
  rejectPartnerInvite: (
    id: number,
  ) => Promise<{ id: number; status: string }>;
}

export class SellerPortalModule
  extends BaseApiModule
  implements ISellerPortalModule
{
  private readonly baseUrl = "/api/v1/seller";

  async getProfile(): Promise<ISellerProfileDto> {
    const response = await this.getClient().get<IApiEnvelope<ISellerProfileDto>>(
      `${this.baseUrl}/profile`,
    );
    return response.data;
  }

  async updateProfile(body: {
    displayName?: string;
    showIdentityInRevenueRanking?: boolean;
  }): Promise<ISellerProfileDto> {
    const response = await this.getClient().patch<
      IApiEnvelope<ISellerProfileDto>
    >(`${this.baseUrl}/profile`, body);
    return response.data;
  }

  async getRevenueRanking(
    query?: ISellerRevenueRankingQueryDto,
  ): Promise<ISellerRevenueRankingDto> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerRevenueRankingDto>
    >(`${this.baseUrl}/revenue-ranking`, { params: query });
    return response.data;
  }

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.getClient().rawRequest<
      IApiEnvelope<{ avatarUrl: string }>
    >({
      method: "POST",
      url: `${this.baseUrl}/profile/avatar`,
      data: formData,
      headers: { Accept: "application/json" },
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData && headers) {
            delete headers["Content-Type"];
          }
          return data;
        },
      ],
    });

    return response.data.data;
  }

  async getWithdrawalContext(): Promise<ISellerWithdrawalContextDto> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerWithdrawalContextDto>
    >(`${this.baseUrl}/withdrawals/context`);
    return response.data;
  }

  async requestWithdrawal(
    body: ICreateSellerWithdrawalBody,
  ): Promise<ISellerWithdrawalResultDto> {
    const response = await this.getClient().post<
      IApiEnvelope<ISellerWithdrawalResultDto>
    >(`${this.baseUrl}/withdrawals`, body);
    return response.data;
  }

  async listApiKeys(): Promise<ISellerApiKeyDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerApiKeyDto[]>
    >(`${this.baseUrl}/api-keys`);
    return response.data;
  }

  async createApiKey(body: {
    name: string;
    apiKey: string;
    permissions: string[];
  }): Promise<ISellerApiKeyDto> {
    const response = await this.getClient().post<
      IApiEnvelope<ISellerApiKeyDto>
    >(`${this.baseUrl}/api-keys`, body);
    return response.data;
  }

  async deleteApiKey(id: number): Promise<void> {
    await this.getClient().delete(`${this.baseUrl}/api-keys/${id}`);
  }

  async listAuthorizedIps(): Promise<ISellerAuthorizedIpDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerAuthorizedIpDto[]>
    >(`${this.baseUrl}/authorized-ips`);
    return response.data;
  }

  async createAuthorizedIp(
    ipAddress: string,
  ): Promise<ISellerAuthorizedIpDto> {
    const response = await this.getClient().post<
      IApiEnvelope<ISellerAuthorizedIpDto>
    >(`${this.baseUrl}/authorized-ips`, { ipAddress });
    return response.data;
  }

  async deleteAuthorizedIp(id: number): Promise<void> {
    await this.getClient().delete(`${this.baseUrl}/authorized-ips/${id}`);
  }

  async listLoginLogs(): Promise<ISellerLoginLogDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerLoginLogDto[]>
    >(`${this.baseUrl}/login-logs`);
    return response.data;
  }

  async deleteLoginLog(id: number): Promise<void> {
    await this.getClient().delete(`${this.baseUrl}/login-logs/${id}`);
  }

  async searchPartnerByEmail(email: string): Promise<TSellerPartnerSearchDto> {
    const response = await this.getClient().get<
      IApiEnvelope<TSellerPartnerSearchDto>
    >(`${this.baseUrl}/partners/search`, { params: { email } });
    return response.data;
  }

  async listPartners(): Promise<ISellerPartnersListDto> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerPartnersListDto>
    >(`${this.baseUrl}/partners`);
    return response.data;
  }

  async invitePartner(body: {
    email: string;
    percentage: number;
    note?: string | null;
  }) {
    const response = await this.getClient().post<
      IApiEnvelope<{
        id: number;
        partner_id: number;
        percentage: number;
        status: string;
        invited_email: string;
        expires_at: string;
      }>
    >(`${this.baseUrl}/partners`, body);
    return response.data;
  }

  async updatePartner(
    id: number,
    body: { percentage?: number; action?: "pause" | "resume" | "revoke" },
  ) {
    const response = await this.getClient().patch<
      IApiEnvelope<{ id: number; status: string; percentage: number }>
    >(`${this.baseUrl}/partners/${id}`, body);
    return response.data;
  }

  async acceptPartnerInvite(id: number) {
    const response = await this.getClient().post<
      IApiEnvelope<{ id: number; status: string; percentage: number }>
    >(`${this.baseUrl}/partners/${id}/accept`);
    return response.data;
  }

  async rejectPartnerInvite(id: number) {
    const response = await this.getClient().post<
      IApiEnvelope<{ id: number; status: string }>
    >(`${this.baseUrl}/partners/${id}/reject`);
    return response.data;
  }
}
