import { HttpClient, IHttpClient } from "../../http-client";
import { AccountModule, IAccountModule } from "./modules/account.module";
import { IRateLimitModule, RateLimitModule } from "./modules/rate-limit.module";
import { ISessionModule, SessionModule } from "./modules/session.module";

export interface IApiService {
  account: IAccountModule;
  rateLimit: IRateLimitModule;
  session: ISessionModule;
}

export class ApiService implements IApiService {
  private readonly httpClient: IHttpClient;

  account: IAccountModule;
  rateLimit: IRateLimitModule;
  session: ISessionModule;

  constructor() {
    this.httpClient = new HttpClient();

    this.account = new AccountModule(this.httpClient);
    this.rateLimit = new RateLimitModule(this.httpClient);
    this.session = new SessionModule(this.httpClient);
  }
}

export const apiService = new ApiService();
