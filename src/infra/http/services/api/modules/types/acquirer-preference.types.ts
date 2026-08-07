export type TAcquirerPreferenceSource =
  | "seller"
  | "platform_default"
  | "routing"
  | "fallback";

export interface IAcquirerSafeSummaryDto {
  id: number;
  name: string;
  description: string | null;
  logoKey: string | null;
  isActive: boolean;
  status: string;
  methods: string[];
}

export interface IAcquirerEffectiveDto {
  acquirerId: number | null;
  name: string | null;
  source: TAcquirerPreferenceSource;
  preferenceUnavailable?: boolean;
  platformDefaultUnavailable?: boolean;
}

export interface IAcquirerPreferenceResponseDto {
  preference: { acquirerId: number | null };
  effective: IAcquirerEffectiveDto;
  platformDefault: {
    acquirerId: number | null;
    name: string | null;
  } | null;
  availableAcquirers: IAcquirerSafeSummaryDto[];
}

export interface IAdminAcquirerPreferenceDto {
  platformDefault: {
    acquirerId: number | null;
    name: string | null;
    isEligible: boolean;
    updatedAt: string | null;
    updatedByUserId: number | null;
  };
  availableAcquirers: IAcquirerSafeSummaryDto[];
  usage: {
    sellersWithPreference: number;
    sellersUsingDefault: number;
  };
}

export function acquirerSourceLabel(source: TAcquirerPreferenceSource): string {
  switch (source) {
    case "seller":
      return "Preferência deste seller";
    case "platform_default":
      return "Padrão da plataforma";
    case "routing":
      return "Roteamento automático";
    case "fallback":
      return "Fallback automático";
    default:
      return source;
  }
}
