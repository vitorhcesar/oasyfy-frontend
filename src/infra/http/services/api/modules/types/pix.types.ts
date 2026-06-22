export interface ICartwaveCreatePixBody {
  amount: number;
  debtor_name: string;
  debtor_document?: string;
  type_document?: string;
}

/** Resposta bruta do Cartwave (não usa envelope da API). */
export interface ICartwavePixResponse {
  error?: string;
  pix_copy_paste?: string;
  qr_code?: {
    emv?: string;
    base64?: string;
  };
  emv?: string;
  base_64_image?: string;
  _routing?: {
    acquirer?: string;
    failover_attempts?: number;
  };
  [key: string]: unknown;
}

export type TPixSearchTransactionRow = Record<string, unknown>;
