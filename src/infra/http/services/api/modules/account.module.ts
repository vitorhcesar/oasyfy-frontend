import type { IApiEnvelope } from "@/infra/http/api-types";
import type { IHttpClient } from "@/infra/http/http-client";

export interface IAccountModule {
  sendSignupVerificationCode: (email: string) => Promise<void>;
  verifySignupVerification: (
    email: string,
    code: string
  ) => Promise<IApiEnvelope<{ success?: boolean }>>;
  sendPasswordRecoveryCode: (
    email: string
  ) => Promise<IApiEnvelope<unknown>>;
  verifyPasswordRecovery: (params: {
    email: string;
    code: string;
    new_password: string;
  }) => Promise<IApiEnvelope<{ success?: boolean }>>;
}

export class AccountModule implements IAccountModule {
  constructor(private readonly httpClient: IHttpClient) {}

  async sendSignupVerificationCode(email: string): Promise<void> {
    await this.httpClient.post("/api/v1/account/signup-verification/send", {
      email,
    });
  }

  verifySignupVerification(
    email: string,
    code: string
  ): Promise<IApiEnvelope<{ success?: boolean }>> {
    return this.httpClient.post(
      "/api/v1/account/signup-verification/verify",
      {
        email,
        code,
      }
    );
  }

  sendPasswordRecoveryCode(
    email: string
  ): Promise<IApiEnvelope<unknown>> {
    return this.httpClient.post("/api/v1/account/password-recovery/send", {
      email,
    });
  }

  verifyPasswordRecovery(params: {
    email: string;
    code: string;
    new_password: string;
  }): Promise<IApiEnvelope<{ success?: boolean }>> {
    return this.httpClient.post(
      "/api/v1/account/password-recovery/verify",
      params
    );
  }
}
