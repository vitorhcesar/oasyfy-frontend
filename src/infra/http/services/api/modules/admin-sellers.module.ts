import type { IApiEnvelope } from "../api-types";
import type { IAdminSellerDto } from "./admin-sellers.types";
import { BaseApiModule } from "./base-api.module";

export type {
  IAdminSellerDto,
  TAdminSellerKycStatus,
} from "./admin-sellers.types";

export interface IAdminSellersModule {
  listSellers(): Promise<IAdminSellerDto[]>;
}

export class AdminSellersModule
  extends BaseApiModule
  implements IAdminSellersModule
{
  private readonly baseUrl = "/api/v1/admin/sellers";

  async listSellers(): Promise<IAdminSellerDto[]> {
    const response =
      await this.getClient().get<IApiEnvelope<IAdminSellerDto[]>>(
        this.baseUrl,
      );
    return response.data;
  }
}
