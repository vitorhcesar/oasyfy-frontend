import { HttpClient, IHttpClient } from "../../http-client";
import { apiAxios } from "./axios-instance";
import { AccountModule, IAccountModule } from "./modules/account.module";
import {
  IKycSubmissionModule,
  KycSubmissionModule,
} from "./modules/kyc-submission.module";
import { IRateLimitModule, RateLimitModule } from "./modules/rate-limit.module";
import { ISessionModule, SessionModule } from "./modules/session.module";
import { IUserModule, UserModule } from "./modules/user.module";

export interface IApiServiceModules {
  account: IAccountModule;
  rateLimit: IRateLimitModule;
  session: ISessionModule;
  kycSubmission: IKycSubmissionModule;
  user: IUserModule;
}

export interface IApiService {
  modules: IApiServiceModules;
}

export class ApiService implements IApiService {
  private readonly httpClient: IHttpClient;

  modules: {
    account: IAccountModule;
    rateLimit: IRateLimitModule;
    session: ISessionModule;
    kycSubmission: IKycSubmissionModule;
    user: IUserModule;
  };

  constructor() {
    this.httpClient = new HttpClient(apiAxios);

    // modules
    this.modules = {
      account: new AccountModule(this.httpClient),
      rateLimit: new RateLimitModule(this.httpClient),
      session: new SessionModule(this.httpClient),
      kycSubmission: new KycSubmissionModule(this.httpClient),
      user: new UserModule(this.httpClient),
    };
  }
}

export const apiService = new ApiService();
