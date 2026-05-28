import { HttpClient, IHttpClient } from "../../http-client";
import { apiAxios } from "./axios-instance";
import { AccountModule, IAccountModule } from "./modules/account.module";
import {
  AdminPlatformMetricsModule,
  IAdminPlatformMetricsModule,
} from "./modules/admin-platform-metrics.module";
import { BannerModule, IBannerModule } from "./modules/banner.module";
import {
  IKycSubmissionModule,
  KycSubmissionModule,
} from "./modules/kyc-submission.module";
import { IRateLimitModule, RateLimitModule } from "./modules/rate-limit.module";
import { ISellerFeeModule, SellerFeeModule } from "./modules/seller-fee.module";
import { ISellerModule, SellerModule } from "./modules/seller.module";
import { ISessionModule, SessionModule } from "./modules/session.module";
import {
  ITransactionModule,
  TransactionModule,
} from "./modules/transaction.module";
import { IUserModule, UserModule } from "./modules/user.module";

export interface IApiServiceModules {
  account: IAccountModule;
  rateLimit: IRateLimitModule;
  session: ISessionModule;
  kycSubmission: IKycSubmissionModule;
  user: IUserModule;
  banner: IBannerModule;
  transaction: ITransactionModule;
  sellerFee: ISellerFeeModule;
  seller: ISellerModule;
  adminPlatformMetrics: IAdminPlatformMetricsModule;
}

export interface IApiService {
  modules: IApiServiceModules;
}

export class ApiService implements IApiService {
  private readonly httpClient: IHttpClient;

  modules: IApiServiceModules;

  constructor() {
    this.httpClient = new HttpClient(apiAxios);

    // modules
    this.modules = {
      account: new AccountModule(this.httpClient),
      rateLimit: new RateLimitModule(this.httpClient),
      session: new SessionModule(this.httpClient),
      kycSubmission: new KycSubmissionModule(this.httpClient),
      user: new UserModule(this.httpClient),
      banner: new BannerModule(this.httpClient),
      transaction: new TransactionModule(this.httpClient),
      sellerFee: new SellerFeeModule(this.httpClient),
      seller: new SellerModule(this.httpClient),
      adminPlatformMetrics: new AdminPlatformMetricsModule(this.httpClient),
    };
  }
}

export const apiService = new ApiService();
