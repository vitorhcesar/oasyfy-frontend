import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IBannerDto {
  id: number;
  image_url: string;
  link_url: string | null;
}

export interface IBannerModule {
  list(): Promise<IBannerDto[]>;
}

export class BannerModule extends BaseApiModule implements IBannerModule {
  private readonly baseUrl = "/api/v1/banners";

  async list(): Promise<IBannerDto[]> {
    const response = await this.getClient().get<IApiEnvelope<IBannerDto[]>>(
      this.baseUrl
    );
    return response.data;
  }
}
