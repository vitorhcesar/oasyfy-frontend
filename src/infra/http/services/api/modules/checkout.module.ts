import { IHttpClient } from "@/infra/http/http-client";
import { BaseApiModule } from "./base-api.module";

export interface IApiEnvelope<T> {
  status: number;
  message: string;
  data: T;
}

export interface ISellerCheckoutDto {
  id: number;
  publicId: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  effectiveStatus: string;
  logoUrl: string | null;
  primaryColor: string;
  backgroundColor: string;
  buttonText: string;
  successMessage: string | null;
  customerDocumentRequired: boolean;
  expiresAt: string | null;
  maxPayments: number | null;
  paymentExpiresInSeconds: number;
  url: string;
  paidCount: number;
  pendingCount: number;
  totalReceived: number;
  createdAt: string;
  updatedAt: string;
}

export interface ISellerCheckoutPaymentDto {
  transactionId: number;
  amount: number;
  status: string;
  customerName: string;
  customerEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateCheckoutBody {
  title: string;
  description?: string | null;
  amount: number;
  logoUrl?: string | null;
  primaryColor?: string;
  backgroundColor?: string;
  buttonText?: string;
  successMessage?: string | null;
  customerDocumentRequired?: boolean;
  expiresAt?: string | null;
  maxPayments?: number | null;
  paymentExpiresInSeconds?: number;
}

export interface IUpdateCheckoutBody extends Partial<ICreateCheckoutBody> {
  status?: "active" | "paused" | "archived";
}

export interface IPublicCheckoutDto {
  publicId: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  available: boolean;
  branding: {
    logoUrl: string | null;
    primaryColor: string;
    backgroundColor: string;
    buttonText: string;
  };
  customerDocumentRequired: boolean;
  successMessage: string;
}

export interface IPublicCheckoutPayResult {
  transactionId: number;
  status: string;
  amount: number;
  pixCode: string | null;
  expiresAt: string;
  successMessage: string;
}

export interface IPublicCheckoutPaymentStatus {
  transactionId: number;
  status: string;
  amount: number;
  updatedAt: string;
  successMessage: string | null;
}

export interface ISellerCheckoutModule {
  list: () => Promise<ISellerCheckoutDto[]>;
  get: (id: number) => Promise<ISellerCheckoutDto>;
  create: (body: ICreateCheckoutBody) => Promise<ISellerCheckoutDto>;
  update: (
    id: number,
    body: IUpdateCheckoutBody,
  ) => Promise<ISellerCheckoutDto>;
  listPayments: (id: number) => Promise<ISellerCheckoutPaymentDto[]>;
  uploadLogo: (file: File) => Promise<{ logoUrl: string }>;
}

export interface IPublicCheckoutModule {
  get: (publicId: string) => Promise<IPublicCheckoutDto>;
  pay: (
    publicId: string,
    body: {
      customer_name: string;
      customer_email?: string | null;
      customer_document?: string | null;
    },
  ) => Promise<IPublicCheckoutPayResult>;
  getPaymentStatus: (
    publicId: string,
    transactionId: number,
  ) => Promise<IPublicCheckoutPaymentStatus>;
}

export class SellerCheckoutModule
  extends BaseApiModule
  implements ISellerCheckoutModule
{
  private readonly baseUrl = "/api/v1/seller/checkouts";

  constructor(httpClient: IHttpClient) {
    super(httpClient);
  }

  async list(): Promise<ISellerCheckoutDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerCheckoutDto[]>
    >(this.baseUrl);
    return response.data;
  }

  async get(id: number): Promise<ISellerCheckoutDto> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerCheckoutDto>
    >(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async create(body: ICreateCheckoutBody): Promise<ISellerCheckoutDto> {
    const response = await this.getClient().post<
      IApiEnvelope<ISellerCheckoutDto>
    >(this.baseUrl, body);
    return response.data;
  }

  async update(
    id: number,
    body: IUpdateCheckoutBody,
  ): Promise<ISellerCheckoutDto> {
    const response = await this.getClient().patch<
      IApiEnvelope<ISellerCheckoutDto>
    >(`${this.baseUrl}/${id}`, body);
    return response.data;
  }

  async listPayments(id: number): Promise<ISellerCheckoutPaymentDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<ISellerCheckoutPaymentDto[]>
    >(`${this.baseUrl}/${id}/payments`);
    return response.data;
  }

  async uploadLogo(file: File): Promise<{ logoUrl: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await this.getClient().rawRequest<
      IApiEnvelope<{ logoUrl: string }>
    >({
      method: "POST",
      url: `${this.baseUrl}/logo`,
      data: formData,
      headers: { Accept: "application/json" },
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData && headers) {
            delete headers["Content-Type"];
          }
          return data;
        },
      ],
    });

    return response.data.data;
  }
}

export class PublicCheckoutModule
  extends BaseApiModule
  implements IPublicCheckoutModule
{
  private readonly baseUrl = "/api/v1/public/checkouts";

  constructor(httpClient: IHttpClient) {
    super(httpClient);
  }

  async get(publicId: string): Promise<IPublicCheckoutDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IPublicCheckoutDto>
    >(`${this.baseUrl}/${publicId}`);
    return response.data;
  }

  async pay(
    publicId: string,
    body: {
      customer_name: string;
      customer_email?: string | null;
      customer_document?: string | null;
    },
  ): Promise<IPublicCheckoutPayResult> {
    const response = await this.getClient().post<
      IApiEnvelope<IPublicCheckoutPayResult>
    >(`${this.baseUrl}/${publicId}/pay`, body);
    return response.data;
  }

  async getPaymentStatus(
    publicId: string,
    transactionId: number,
  ): Promise<IPublicCheckoutPaymentStatus> {
    const response = await this.getClient().get<
      IApiEnvelope<IPublicCheckoutPaymentStatus>
    >(`${this.baseUrl}/${publicId}/payments/${transactionId}`);
    return response.data;
  }
}
