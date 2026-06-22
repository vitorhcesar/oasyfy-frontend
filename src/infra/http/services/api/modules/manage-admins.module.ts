import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IManageAdminsAddBody {
  action: "add";
  email: string;
  password: string;
  full_name?: string | null;
}

export interface IManageAdminsRemoveBody {
  action: "remove";
  target_user_id: number;
}

export type TManageAdminsBody = IManageAdminsAddBody | IManageAdminsRemoveBody;

export interface IManageAdminsResult {
  success: true;
  user_id?: number;
}

export interface IAdminManagerDto {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export interface IManageAdminsModule {
  execute: (body: TManageAdminsBody) => Promise<IManageAdminsResult>;
  listManagers: () => Promise<IAdminManagerDto[]>;
}

export class ManageAdminsModule
  extends BaseApiModule
  implements IManageAdminsModule
{
  private readonly baseUrl = "/api/v1/manage-admins";

  async execute(body: TManageAdminsBody): Promise<IManageAdminsResult> {
    const response = await this.getClient().post<
      IApiEnvelope<IManageAdminsResult>
    >(this.baseUrl, body);
    return response.data;
  }

  async listManagers(): Promise<IAdminManagerDto[]> {
    const response = await this.getClient().get<
      IApiEnvelope<
        Array<{
          userId: number;
          email: string;
          fullName: string | null;
          createdAt: string;
        }>
      >
    >("/api/v1/admin/managers");

    return response.data.map((manager) => ({
      user_id: String(manager.userId),
      email: manager.email,
      full_name: manager.fullName,
      created_at: manager.createdAt,
    }));
  }
}
