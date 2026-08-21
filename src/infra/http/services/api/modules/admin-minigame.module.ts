import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IAdminMinigameDetailDto,
  IAdminMinigameListItem,
  IMinigameChallengeDto,
  TMinigameStatus,
} from "./types/minigame.types";

export interface IAdminMinigameModule {
  list(query?: {
    status?: TMinigameStatus;
    sellerId?: number;
    cursor?: number;
    limit?: number;
  }): Promise<{ items: IAdminMinigameListItem[]; nextCursor: number | null }>;
  get(id: number): Promise<IAdminMinigameDetailDto>;
  reverse(id: number, reason: string): Promise<IMinigameChallengeDto>;
}

export class AdminMinigameModule
  extends BaseApiModule
  implements IAdminMinigameModule
{
  private readonly baseUrl = "/api/v1/admin/minigames";

  async list(query?: {
    status?: TMinigameStatus;
    sellerId?: number;
    cursor?: number;
    limit?: number;
  }) {
    const response = await this.getClient().get<
      IApiEnvelope<{
        items: IAdminMinigameListItem[];
        nextCursor: number | null;
      }>
    >(this.baseUrl, { params: query });
    return response.data;
  }

  async get(id: number) {
    const response = await this.getClient().get<
      IApiEnvelope<IAdminMinigameDetailDto>
    >(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async reverse(id: number, reason: string) {
    const response = await this.getClient().post<
      IApiEnvelope<IMinigameChallengeDto>
    >(`${this.baseUrl}/${id}/reverse`, { reason });
    return response.data;
  }
}
