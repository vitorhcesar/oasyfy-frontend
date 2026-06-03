import { IApiEnvelope } from "../api-types";
import { BaseApiModule } from "./base-api.module";

export interface IGatewayThemeDto {
  id: number;
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  cardForeground: string;
  borderColor: string;
  mutedColor: string;
  mutedForeground: string;
  accentColor: string;
  accentForeground: string;
  destructiveColor: string;
  successColor: string;
  warningColor: string;
  darkPrimaryColor: string;
  darkBackgroundColor: string;
  darkForegroundColor: string;
  darkCardColor: string;
  darkCardForeground: string;
  darkBorderColor: string;
  darkMutedColor: string;
  darkMutedForeground: string;
  darkAccentColor: string;
  darkAccentForeground: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateGatewayThemeData {
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  cardForeground: string;
  borderColor: string;
  mutedColor: string;
  mutedForeground: string;
  accentColor: string;
  accentForeground: string;
  destructiveColor: string;
  successColor: string;
  warningColor: string;
  darkPrimaryColor: string;
  darkBackgroundColor: string;
  darkForegroundColor: string;
  darkCardColor: string;
  darkCardForeground: string;
  darkBorderColor: string;
  darkMutedColor: string;
  darkMutedForeground: string;
  darkAccentColor: string;
  darkAccentForeground: string;
}

export interface IGatewayThemeModule {
  find(): Promise<IGatewayThemeDto>;
  update(data: IUpdateGatewayThemeData): Promise<void>;
}

export class GatewayThemeModule
  extends BaseApiModule
  implements IGatewayThemeModule
{
  private readonly baseUrl = "/api/v1/gateway-theme";

  async find(): Promise<IGatewayThemeDto> {
    const response = await this.getClient().get<IApiEnvelope<IGatewayThemeDto>>(
      this.baseUrl,
    );
    return response.data;
  }

  async update(data: IUpdateGatewayThemeData): Promise<void> {
    const response = await this.getClient().put<IApiEnvelope<void>>(
      this.baseUrl,
      data,
    );
    return response.data;
  }
}
