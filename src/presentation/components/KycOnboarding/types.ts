// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace KycOnboardingTypes {
  export type TStep =
    | "type"
    | "personal"
    | "address"
    | "documents"
    | "bank"
    | "review";

  export type TPersonType = "pf" | "pj";

  export interface IBankData {
    bankName: string;
    agency: string;
    agencyDigit: string;
    account: string;
    accountDigit: string;
    accountType: "corrente" | "poupanca";
    pixKeyType: "cpf" | "cnpj" | "email" | "phone";
    pixKey: string;
  }

  export interface IFormData {
    personType: TPersonType | null;
    fullName: string;
    cpf: string;
    dateOfBirth: string;
    phone: string;
    companyName: string;
    companyType: string;
    cnpj: string;
    tradingName: string;
    businessActivity: string;
    monthlyRevenue: string;
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    bank: IBankData;
  }

  export interface IUploadedFile {
    file: File;
    preview: string;
    uploading: boolean;
    url: string | null;
  }
}
