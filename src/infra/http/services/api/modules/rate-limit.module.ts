import type { IApiEnvelope } from "@/infra/http/api-types";
import type { IHttpClient } from "@/infra/http/http-client";

export interface IRateLimitModule {
  checkSignup: () => Promise<
    IApiEnvelope<{ allowed?: boolean; message?: string }>
  >;
}

export class RateLimitModule implements IRateLimitModule {
  constructor(private readonly httpClient: IHttpClient) {}

  checkSignup(): Promise<
    IApiEnvelope<{ allowed?: boolean; message?: string }>
  > {
    return this.httpClient.post("/api/v1/rate-limit/check", {
      action: "signup",
    });
  }
}
