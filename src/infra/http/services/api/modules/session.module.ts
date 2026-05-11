import type { IApiEnvelope } from "@/infra/http/api-types";
import { BaseApiModule } from "./base-api.module";

export interface ISessionContextDto {
  role: "admin" | "seller" | null;
  isBanned: boolean;
  emailManuallyApproved: boolean;
}

export interface ISessionModule {
  getContext: () => Promise<ISessionContextDto>;
}

export class SessionModule extends BaseApiModule implements ISessionModule {
  async getContext(): Promise<ISessionContextDto> {
    const body = await this.getClient().get<IApiEnvelope<ISessionContextDto>>(
      "/api/v1/session/context"
    );
    return body.data;
  }
}
