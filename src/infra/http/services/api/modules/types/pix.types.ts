export interface ICreatePixChargeBody {
  amount: number;
  customer_name: string;
  customer_email?: string;
  customer_tax_id?: string;
  comment?: string;
  expires_in?: number;
}

/** Resposta bruta do failover PIX (Woovi/Cartwave). */
export interface IPixChargeResponse {
  error?: string;
  pix_copy_and_paste?: string;
  pix_copy_paste?: string;
  copy_and_paste?: string;
  emv?: string;
  brCode?: string;
  brcode?: string;
  base_64_image?: string;
  pixCopiaECola?: string;
  woovi_charge?: {
    brCode?: string;
    qrCodeImage?: string;
  };
  onlyup_charge?: {
    pixCopiaECola?: string;
    brCode?: string;
  };
  charge?: {
    brCode?: string;
    qrCodeImage?: string;
    pixCopiaECola?: string;
  };
  qr_code?: {
    emv?: string;
    base64?: string;
  };
  _routing?: {
    acquirer?: string;
    provider?: string;
    failover_attempts?: number;
  };
  [key: string]: unknown;
}

export interface ICartwaveCreatePixBody {
  amount: number;
  debtor_name: string;
  debtor_document?: string;
  type_document?: string;
}

/** @deprecated Use IPixChargeResponse */
export type ICartwavePixResponse = IPixChargeResponse;

export type TPixSearchTransactionRow = Record<string, unknown>;
