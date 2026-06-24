import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IGetSellerFeeResponseDto {
  id: number;
  pixRetentionDays: number;
  cardRetentionDays: number;
  boletoRetentionDays: number;
  cryptoRetentionDays: number;
  billingGoal: number;
  withdrawalMinAmount: number;
  withdrawalMaxAmount: number;
  withdrawalDailyMax: number;
}

export interface IGetFullSellerFeeResponseDto {
  id: number;
  name: string;
  pixFixedFee: number;
  pixVariableFee: number;
  pixMinFee: number;
  pixRetentionFee: number;
  pixRetentionDays: number;
  cardFixedFee: number;
  cardVariableFee: number;
  cardMinFee: number;
  cardRetentionFee: number;
  cardRetentionDays: number;
  boletoFixedFee: number;
  boletoVariableFee: number;
  boletoMinFee: number;
  boletoRetentionFee: number;
  boletoRetentionDays: number;
  cryptoFixedFee: number;
  cryptoVariableFee: number;
  cryptoMinFee: number;
  cryptoRetentionFee: number;
  cryptoRetentionDays: number;
  withdrawalFixedFee: number;
  withdrawalVariableFee: number;
  withdrawalMinFee: number;
  billingGoal: number;
  withdrawalMinAmount: number;
  withdrawalMaxAmount: number;
  withdrawalDailyMax: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateSellerFeeRequestDto {
  name: string;
  pixFixedFee: number;
  pixVariableFee: number;
  pixMinFee: number;
  pixRetentionFee: number;
  pixRetentionDays: number;
  cardFixedFee: number;
  cardVariableFee: number;
  cardMinFee: number;
  cardRetentionFee: number;
  cardRetentionDays: number;
  boletoFixedFee: number;
  boletoVariableFee: number;
  boletoMinFee: number;
  boletoRetentionFee: number;
  boletoRetentionDays: number;
  cryptoFixedFee: number;
  cryptoVariableFee: number;
  cryptoMinFee: number;
  cryptoRetentionFee: number;
  cryptoRetentionDays: number;
  withdrawalFixedFee: number;
  withdrawalVariableFee: number;
  withdrawalMinFee: number;
  billingGoal: number;
  withdrawalMinAmount: number;
  withdrawalMaxAmount: number;
  withdrawalDailyMax: number;
}

export type TCreateSellerFeeResponseDto = IGetFullSellerFeeResponseDto;

export interface IUpdateSellerFeeRequestDto extends ICreateSellerFeeRequestDto {
  id: string;
}

export type TUpdateSellerFeeResponseDto = IGetFullSellerFeeResponseDto;

export interface ISellerFeeModule {
  getSellerFee(): Promise<IGetSellerFeeResponseDto>;
  getMyFullSellerFee(): Promise<IGetFullSellerFeeResponseDto>;
  getFullSellerFee(sellerId?: number): Promise<IGetFullSellerFeeResponseDto>;
  listSellerFees(): Promise<IGetFullSellerFeeResponseDto[]>;
  createSellerFee(
    payload: ICreateSellerFeeRequestDto,
  ): Promise<TCreateSellerFeeResponseDto>;
  updateSellerFee(
    payload: IUpdateSellerFeeRequestDto,
  ): Promise<TUpdateSellerFeeResponseDto>;
  assignSellerFee(userId: number, sellerFeeId: number): Promise<void>;
  deleteSellerFee(sellerFeeId: number): Promise<void>;
}

export class SellerFeeModule extends BaseApiModule implements ISellerFeeModule {
  private readonly baseUrl = "/api/v1/seller-fee";
  private readonly adminBaseUrl = "/api/v1/seller-fees";

  async getSellerFee(): Promise<IGetSellerFeeResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IGetSellerFeeResponseDto>
    >(this.baseUrl);
    return response.data;
  }

  async getMyFullSellerFee(): Promise<IGetFullSellerFeeResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IGetFullSellerFeeResponseDto>
    >(`${this.baseUrl}/full`);
    return response.data;
  }

  async getFullSellerFee(
    sellerId?: number,
  ): Promise<IGetFullSellerFeeResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IGetFullSellerFeeResponseDto>
    >(`${this.baseUrl}/full`, { params: { sellerId } });
    return response.data;
  }

  async listSellerFees(): Promise<IGetFullSellerFeeResponseDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<IGetFullSellerFeeResponseDto[]>
    >(this.adminBaseUrl);
    return response.data;
  }

  async createSellerFee(
    payload: ICreateSellerFeeRequestDto,
  ): Promise<TCreateSellerFeeResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<TCreateSellerFeeResponseDto>
    >(this.baseUrl, payload);
    return response.data;
  }

  async updateSellerFee(
    payload: IUpdateSellerFeeRequestDto,
  ): Promise<TUpdateSellerFeeResponseDto> {
    const { id, ...data } = payload;
    const response = await this.getClient().put<
      IApiEnvelope<TUpdateSellerFeeResponseDto>
    >(`${this.baseUrl}/${id}`, data);
    return response.data;
  }

  async assignSellerFee(userId: number, sellerFeeId: number): Promise<void> {
    await this.getClient().patch(
      `/api/v1/users/${userId}/seller-fee`,
      { sellerFeeId },
    );
  }

  async deleteSellerFee(sellerFeeId: number): Promise<void> {
    await this.getClient().delete(`${this.adminBaseUrl}/${sellerFeeId}`);
  }
}
