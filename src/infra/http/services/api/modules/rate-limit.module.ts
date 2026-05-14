import type { IApiEnvelope } from "@/infra/http/services/api/api-types";
import { BaseApiModule } from "./base-api.module";

interface ICheckSignupResponseDto {
  allowed?: boolean;
  message?: string;
}

export interface IRateLimitModule {
  checkSignup: () => Promise<IApiEnvelope<ICheckSignupResponseDto>>;
}

export class RateLimitModule extends BaseApiModule implements IRateLimitModule {
  checkSignup(): Promise<IApiEnvelope<ICheckSignupResponseDto>> {
    return this.getClient().post("/api/v1/rate-limit/check", {
      action: "signup",
    });
  }
}
