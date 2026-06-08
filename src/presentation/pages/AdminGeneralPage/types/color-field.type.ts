import { IGatewayThemeColors } from "@/infra/http/services/api/modules/types/gateway-theme.types";

export interface IColorField {
  key: Exclude<keyof IGatewayThemeColors, "id">;
  label: string;
  description: string;
}
