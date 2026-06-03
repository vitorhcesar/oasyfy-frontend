import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IAdminKycSubmissionsQueryDto,
  IAdminKycSubmissionsResponseDto,
} from "./types/admin-kyc-submissions.types";

export type {
  IAdminKycSubmissionDto,
  IAdminKycSubmissionsQueryDto,
  IAdminKycSubmissionsResponseDto,
  IAdminRegisteredSellerDto,
  TAdminKycListFilter,
} from "./types/admin-kyc-submissions.types";

export interface IAdminKycSubmissionsModule {
  listSubmissions(
    query: IAdminKycSubmissionsQueryDto,
  ): Promise<IAdminKycSubmissionsResponseDto>;
}

export class AdminKycSubmissionsModule
  extends BaseApiModule
  implements IAdminKycSubmissionsModule
{
  private readonly baseUrl = "/api/v1/admin/kyc-submissions";

  async listSubmissions(
    query: IAdminKycSubmissionsQueryDto,
  ): Promise<IAdminKycSubmissionsResponseDto> {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminKycSubmissionsResponseDto>
    >(this.baseUrl, { params: query });
    return response.data;
  }
}
