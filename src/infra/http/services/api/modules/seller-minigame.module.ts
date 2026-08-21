import type { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";
import type {
  IMinigameChallengeDto,
  IMinigameInboxDto,
  IMinigameMatchDto,
  IMinigameQuoteDto,
} from "./types/minigame.types";

export interface ISellerMinigameModule {
  getPreferences(): Promise<{ challengesEnabled: boolean }>;
  setPreferences(
    challengesEnabled: boolean,
  ): Promise<{ challengesEnabled: boolean }>;
  quote(stakeReais: number): Promise<IMinigameQuoteDto>;
  inbox(): Promise<IMinigameInboxDto>;
  createChallenge(input: {
    targetSellerId: number;
    type: "rock_paper_scissors";
    stakeReais: number;
    gameConfig: { bestOf: 3 | 5 | 7 };
  }): Promise<IMinigameChallengeDto>;
  accept(id: number): Promise<IMinigameMatchDto>;
  decline(id: number): Promise<{ ok: boolean }>;
  withdraw(id: number): Promise<{ ok: boolean }>;
  getMatch(id: number): Promise<IMinigameMatchDto>;
  submitChoice(
    id: number,
    input: { roundNumber: number; choice: "rock" | "paper" | "scissors" },
  ): Promise<IMinigameMatchDto>;
}

export class SellerMinigameModule
  extends BaseApiModule
  implements ISellerMinigameModule
{
  private readonly baseUrl = "/api/v1/praca/minigames";

  async getPreferences() {
    const response = await this.getClient().get<
      IApiEnvelope<{ challengesEnabled: boolean }>
    >(`${this.baseUrl}/preferences`);
    return response.data;
  }

  async setPreferences(challengesEnabled: boolean) {
    const response = await this.getClient().patch<
      IApiEnvelope<{ challengesEnabled: boolean }>
    >(`${this.baseUrl}/preferences`, { challengesEnabled });
    return response.data;
  }

  async quote(stakeReais: number) {
    const response = await this.getClient().get<IApiEnvelope<IMinigameQuoteDto>>(
      `${this.baseUrl}/quote`,
      { params: { stakeReais } },
    );
    return response.data;
  }

  async inbox() {
    const response = await this.getClient().get<IApiEnvelope<IMinigameInboxDto>>(
      `${this.baseUrl}/challenges/inbox`,
    );
    return response.data;
  }

  async createChallenge(input: {
    targetSellerId: number;
    type: "rock_paper_scissors";
    stakeReais: number;
    gameConfig: { bestOf: 3 | 5 | 7 };
  }) {
    const response = await this.getClient().post<
      IApiEnvelope<IMinigameChallengeDto>
    >(`${this.baseUrl}/challenges`, input);
    return response.data;
  }

  async accept(id: number) {
    const response = await this.getClient().post<IApiEnvelope<IMinigameMatchDto>>(
      `${this.baseUrl}/challenges/${id}/accept`,
    );
    return response.data;
  }

  async decline(id: number) {
    const response = await this.getClient().post<IApiEnvelope<{ ok: boolean }>>(
      `${this.baseUrl}/challenges/${id}/decline`,
    );
    return response.data;
  }

  async withdraw(id: number) {
    const response = await this.getClient().post<IApiEnvelope<{ ok: boolean }>>(
      `${this.baseUrl}/challenges/${id}/withdraw`,
    );
    return response.data;
  }

  async getMatch(id: number) {
    const response = await this.getClient().get<IApiEnvelope<IMinigameMatchDto>>(
      `${this.baseUrl}/${id}`,
    );
    return response.data;
  }

  async submitChoice(
    id: number,
    input: { roundNumber: number; choice: "rock" | "paper" | "scissors" },
  ) {
    const response = await this.getClient().post<IApiEnvelope<IMinigameMatchDto>>(
      `${this.baseUrl}/${id}/choice`,
      input,
    );
    return response.data;
  }
}
