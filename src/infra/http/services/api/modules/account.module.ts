import type { IApiEnvelope } from "@/infra/http/services/api/api-types";
import { BaseApiModule } from "./base-api.module";

export interface IAccountModule {
  sendSignupVerificationCode: (email: string) => Promise<void>;
  verifySignupVerification: (
    email: string,
    code: string
  ) => Promise<IApiEnvelope<{ success?: boolean }>>;
  sendPasswordRecoveryCode: (email: string) => Promise<IApiEnvelope<unknown>>;
  verifyPasswordRecovery: (params: {
    email: string;
    code: string;
    new_password: string;
  }) => Promise<IApiEnvelope<{ success?: boolean }>>;
}

export class AccountModule extends BaseApiModule implements IAccountModule {
  async sendSignupVerificationCode(email: string): Promise<void> {
    await this.getClient().post("/api/v1/account/signup-verification/send", {
      email,
    });
  }

  verifySignupVerification(
    email: string,
    code: string
  ): Promise<IApiEnvelope<{ success?: boolean }>> {
    return this.getClient().post("/api/v1/account/signup-verification/verify", {
      email,
      code,
    });
  }

  sendPasswordRecoveryCode(email: string): Promise<IApiEnvelope<unknown>> {
    return this.getClient().post("/api/v1/account/password-recovery/send", {
      email,
    });
  }

  verifyPasswordRecovery(params: {
    email: string;
    code: string;
    new_password: string;
  }): Promise<IApiEnvelope<{ success?: boolean }>> {
    return this.getClient().post(
      "/api/v1/account/password-recovery/verify",
      params
    );
  }
}
