export type TKycBankAccountType = "corrente" | "poupanca";

export type TKycPixKeyType = "cpf" | "cnpj" | "email" | "phone";

export interface IKycSubmissionBankData {
  bankName: string;
  agency: string;
  agencyDigit: string;
  account: string;
  accountDigit: string;
  accountType: TKycBankAccountType;
  pixKeyType: TKycPixKeyType;
  pixKey: string;
}
