import type { IApiEnvelope } from "@/infra/http/api-types";
import type { IHttpClient } from "@/infra/http/http-client";

export interface ISessionContextDto {
  role: "admin" | "seller" | null;
  isBanned: boolean;
  emailManuallyApproved: boolean;
}

export interface ISessionModule {
  getContext: () => Promise<ISessionContextDto>;
}

export class SessionModule implements ISessionModule {
  constructor(private readonly httpClient: IHttpClient) {}

  async getContext(): Promise<ISessionContextDto> {
    const body = await this.httpClient.get<IApiEnvelope<ISessionContextDto>>(
      "/api/v1/session/context"
    );
    return body.data;
  }
}
