import { HttpClient, IHttpClient } from "../../http-client";
import { apiAxios } from "./axios-instance";
import { AccountModule, IAccountModule } from "./modules/account.module";
import {
  AdminConfigModule,
  IAdminConfigModule,
} from "./modules/admin-config.module";
import {
  AdminFinanceModule,
  IAdminFinanceModule,
} from "./modules/admin-finance.module";
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
import { BalanceModule, IBalanceModule } from "./modules/balance.module";
import { BannerModule, IBannerModule } from "./modules/banner.module";
import { EmailModule, IEmailModule } from "./modules/email.module";
import {
  IManageAdminsModule,
  ManageAdminsModule,
} from "./modules/manage-admins.module";
import { IPixModule, PixModule } from "./modules/pix.module";
import { IWhatsappModule, WhatsappModule } from "./modules/whatsapp.module";
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
import {
  ISellerPortalModule,
  SellerPortalModule,
} from "./modules/seller-portal.module";
import {
  ISellerNotificationsModule,
  SellerNotificationsModule,
} from "./modules/seller-notifications.module";
import {
  ISellerPracaModule,
  SellerPracaModule,
} from "./modules/seller-praca.module";
import {
  IAdminPracaModule,
  AdminPracaModule,
} from "./modules/admin-praca.module";
import {
  ISellerAcquirerModule,
  SellerAcquirerModule,
} from "./modules/seller-acquirer.module";
import {
  IPublicCheckoutModule,
  ISellerCheckoutModule,
  PublicCheckoutModule,
  SellerCheckoutModule,
} from "./modules/checkout.module";
import { ISessionModule, SessionModule } from "./modules/session.module";
import {
  ITransactionModule,
  TransactionModule,
} from "./modules/transaction.module";
import { IUserModule, UserModule } from "./modules/user.module";

export interface IApiServiceModules {
  // admin
  adminPlatformMetrics: IAdminPlatformMetricsModule;
  adminSellers: IAdminSellersModule;
  adminKycSubmissions: IAdminKycSubmissionsModule;
  adminBanners: IAdminBannerModule;
  adminFinance: IAdminFinanceModule;
  adminConfig: IAdminConfigModule;
  adminPraca: IAdminPracaModule;

  account: IAccountModule;
  balance: IBalanceModule;
  rateLimit: IRateLimitModule;
  session: ISessionModule;
  kycSubmission: IKycSubmissionModule;
  user: IUserModule;
  banner: IBannerModule;
  transaction: ITransactionModule;
  sellerFee: ISellerFeeModule;
  seller: ISellerModule;
  sellerPortal: ISellerPortalModule;
  sellerNotifications: ISellerNotificationsModule;
  sellerPraca: ISellerPracaModule;
  sellerAcquirer: ISellerAcquirerModule;
  sellerCheckouts: ISellerCheckoutModule;
  publicCheckouts: IPublicCheckoutModule;
  gatewayTheme: IGatewayThemeModule;
  email: IEmailModule;
  pix: IPixModule;
  whatsapp: IWhatsappModule;
  manageAdmins: IManageAdminsModule;
}

function attachModules(httpClient: IHttpClient): IApiServiceModules {
  return {
    // admin
    adminPlatformMetrics: new AdminPlatformMetricsModule(httpClient),
    adminSellers: new AdminSellersModule(httpClient),
    adminKycSubmissions: new AdminKycSubmissionsModule(httpClient),
    adminBanners: new AdminBannerModule(httpClient),
    adminFinance: new AdminFinanceModule(httpClient),
    adminConfig: new AdminConfigModule(httpClient),
    adminPraca: new AdminPracaModule(httpClient),

    account: new AccountModule(httpClient),
    balance: new BalanceModule(httpClient),
    gatewayTheme: new GatewayThemeModule(httpClient),
    rateLimit: new RateLimitModule(httpClient),
    session: new SessionModule(httpClient),
    kycSubmission: new KycSubmissionModule(httpClient),
    user: new UserModule(httpClient),
    banner: new BannerModule(httpClient),
    transaction: new TransactionModule(httpClient),
    sellerFee: new SellerFeeModule(httpClient),
    seller: new SellerModule(httpClient),
    sellerPortal: new SellerPortalModule(httpClient),
    sellerNotifications: new SellerNotificationsModule(httpClient),
    sellerPraca: new SellerPracaModule(httpClient),
    sellerAcquirer: new SellerAcquirerModule(httpClient),
    sellerCheckouts: new SellerCheckoutModule(httpClient),
    publicCheckouts: new PublicCheckoutModule(httpClient),
    email: new EmailModule(httpClient),
    pix: new PixModule(httpClient),
    whatsapp: new WhatsappModule(httpClient),
    manageAdmins: new ManageAdminsModule(httpClient),
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
