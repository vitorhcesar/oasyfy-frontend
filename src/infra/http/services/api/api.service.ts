import { HttpClient, IHttpClient } from "../../http-client";
import { apiAxios } from "./axios-instance";
import { AccountModule, IAccountModule } from "./modules/account.module";
import {
  AdminBannerModule,
  IAdminBannerModule,
} from "./modules/admin-banner.module";
import {
  AdminKycSubmissionsModule,
  IAdminKycSubmissionsModule,
} from "./modules/admin-kyc-submissions.module";
import {
  AdminPlatformMetricsModule,
  IAdminPlatformMetricsModule,
} from "./modules/admin-platform-metrics.module";
import {
  AdminSellersModule,
  IAdminSellersModule,
} from "./modules/admin-sellers.module";
import { BannerModule, IBannerModule } from "./modules/banner.module";
import {
  GatewayThemeModule,
  IGatewayThemeModule,
} from "./modules/gateway-theme.module";
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
  adminSellers: IAdminSellersModule;
  adminKycSubmissions: IAdminKycSubmissionsModule;
  adminBanners: IAdminBannerModule;
  gatewayTheme: IGatewayThemeModule;
}

function attachModules(httpClient: IHttpClient): IApiServiceModules {
  return {
    // admin
    adminPlatformMetrics: new AdminPlatformMetricsModule(httpClient),
    adminSellers: new AdminSellersModule(httpClient),
    adminKycSubmissions: new AdminKycSubmissionsModule(httpClient),
    adminBanners: new AdminBannerModule(httpClient),

    gatewayTheme: new GatewayThemeModule(httpClient),
    account: new AccountModule(httpClient),
    rateLimit: new RateLimitModule(httpClient),
    session: new SessionModule(httpClient),
    kycSubmission: new KycSubmissionModule(httpClient),
    user: new UserModule(httpClient),
    banner: new BannerModule(httpClient),
    transaction: new TransactionModule(httpClient),
    sellerFee: new SellerFeeModule(httpClient),
    seller: new SellerModule(httpClient),
  };
}

export interface IApiService {
  modules: IApiServiceModules;
}

export class ApiService implements IApiService {
  private readonly httpClient: IHttpClient;

  modules: IApiServiceModules;

  constructor() {
    this.httpClient = new HttpClient(apiAxios);
    this.modules = attachModules(this.httpClient);
  }
}

export const apiService = new ApiService();
