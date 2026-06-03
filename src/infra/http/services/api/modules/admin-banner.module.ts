import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IAdminBannerDto {
  id: number;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminBannerModule {
  list(): Promise<IAdminBannerDto[]>;
  create(
    title: string | null,
    linkUrl: string | null,
    file: File,
  ): Promise<void>;
  toggleActive(bannerId: number): Promise<void>;
  delete(bannerId: number): Promise<void>;
}

export class AdminBannerModule
  extends BaseApiModule
  implements IAdminBannerModule
{
  private readonly baseUrl = "/api/v1/admin/banners";

  async list(): Promise<IAdminBannerDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminBannerDto[]>
    >(this.baseUrl);
    return response.data;
  }

  async create(
    title: string | null,
    linkUrl: string | null,
    file: File,
  ): Promise<void> {
    const response = await this.getClient().post<IApiEnvelope<void>>(
      this.baseUrl,
      { title, linkUrl, file },
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  }

  async toggleActive(bannerId: number): Promise<void> {
    const response = await this.getClient().put<IApiEnvelope<void>>(
      `${this.baseUrl}/${bannerId}/toggle-active`,
    );
    return response.data;
  }

  async delete(bannerId: number): Promise<void> {
    const response = await this.getClient().delete<IApiEnvelope<void>>(
      `${this.baseUrl}/${bannerId}`,
    );
    return response.data;
  }
}
