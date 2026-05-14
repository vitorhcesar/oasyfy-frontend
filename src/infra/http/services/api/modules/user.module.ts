import { IApiEnvelope } from "@/infra/http/services/api/api-types";
import { BaseApiModule } from "./base-api.module";

export interface ISetUserToSellerResponseDto {
  success: true;
}

export interface IUserModule {
  setUserToSeller: (userId: number) => Promise<ISetUserToSellerResponseDto>;
}

export class UserModule extends BaseApiModule implements IUserModule {
  async setUserToSeller(userId: number): Promise<ISetUserToSellerResponseDto> {
    const response = await this.getClient().post<
      IApiEnvelope<ISetUserToSellerResponseDto>
    >(`/api/v1/users/set-seller/${userId}`);
    return response.data;
  }
}
