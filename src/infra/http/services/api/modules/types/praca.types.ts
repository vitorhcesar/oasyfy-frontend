export type TPracaAccessStatus =
  | "disabled"
  | "pending"
  | "rejected"
  | "enabled";

export type TPracaAuthorRole = "seller" | "admin";

export interface IPracaAccessDto {
  status: TPracaAccessStatus;
  requestedAt: string | null;
  reviewedAt: string | null;
}

export interface IPracaMessageDto {
  id: number;
  body: string;
  createdAt: string;
  author: {
    id: number;
    displayName: string;
    role: TPracaAuthorRole;
  };
}

export interface IPracaMessagesPageDto {
  messages: IPracaMessageDto[];
  nextCursor: number | null;
}

export interface IPracaAccessRequestDto {
  id: number;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ISetPracaAccessResultDto {
  enabled: boolean;
  emailSent: boolean;
  purged: number;
}
