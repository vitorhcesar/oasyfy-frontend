import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface ISellerProfileDto {
  fullName: string | null;
  displayName: string;
  avatarUrl: string | null;
  accountId: string;
  email: string | null;
}

export interface ISellerWithdrawalLimitsDto {
  withdrawalMinAmount: number;
  withdrawalMaxAmount: number;
  withdrawalDailyMax: number;
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

export interface ISellerPortalModule {
  getProfile: () => Promise<ISellerProfileDto>;
  updateProfile: (displayName: string) => Promise<ISellerProfileDto>;
  uploadAvatar: (file: File) => Promise<{ avatarUrl: string }>;
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
}

export interface ISellerLoginLogDto {
  id: number;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
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

  async updateProfile(displayName: string): Promise<ISellerProfileDto> {
    const response = await this.getClient().patch<
      IApiEnvelope<ISellerProfileDto>
    >(`${this.baseUrl}/profile`, { displayName });
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
}
