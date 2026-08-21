export type TMinigameType = "rock_paper_scissors";
export type TRpsChoice = "rock" | "paper" | "scissors";
export type TRpsBestOf = 3 | 5 | 7;

export type TMinigameStatus =
  | "pending"
  | "declined"
  | "expired"
  | "in_progress"
  | "completed"
  | "reversed"
  | "forfeited";

export interface IMinigameChallengeDto {
  id: number;
  type: TMinigameType;
  status: TMinigameStatus;
  stakeCents: number;
  potCents: number;
  feeCents: number;
  gameConfig: { bestOf: TRpsBestOf };
  challenger: { sellerId: number | null; displayName: string };
  challenged: { sellerId: number | null; displayName: string };
  expiresAt: string;
  createdAt: string;
}

export interface IMinigameMatchDto {
  id: number;
  type: TMinigameType;
  status: TMinigameStatus;
  stakeCents: number;
  potCents: number;
  feeCents: number;
  gameConfig: { bestOf: TRpsBestOf };
  you: {
    sellerId: number;
    displayName: string;
    score: number;
    avatarUrl: string | null;
  };
  opponent: {
    sellerId: number | null;
    displayName: string;
    score: number;
    avatarUrl: string | null;
  };
  currentRound: {
    roundNumber: number;
    deadlineAt: string;
    youLocked: boolean;
    opponentLocked: boolean;
    yourChoice?: TRpsChoice;
    opponentChoice?: TRpsChoice;
    winnerSide?: "you" | "opponent" | "draw";
  } | null;
  rounds: Array<{
    roundNumber: number;
    yourChoice: TRpsChoice | null;
    opponentChoice: TRpsChoice | null;
    winnerSide: "you" | "opponent" | "draw" | null;
    youTimedOut: boolean;
    opponentTimedOut: boolean;
  }>;
  winnerSellerId: number | null;
  settlement: {
    winnerCreditCents: number;
    winnerNetCents: number;
    feeCents: number;
    youWon: boolean;
  } | null;
}

export interface IMinigameQuoteDto {
  stakeCents: number;
  potCents: number;
  feeCents: number;
  winnerCreditCents: number;
  winnerNetCents: number;
}

export interface IMinigameInboxDto {
  challenges: IMinigameChallengeDto[];
  activeMinigameId: number | null;
}

export interface IAdminMinigameListItem {
  id: number;
  type: TMinigameType;
  status: TMinigameStatus;
  stakeCents: number;
  potCents: number;
  feeCents: number;
  challengerSellerId: number | null;
  challengerNameSnapshot: string;
  challengedSellerId: number | null;
  challengedNameSnapshot: string;
  winnerSellerId: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface IAdminMinigameDetailDto extends IMinigameChallengeDto {
  winnerSellerId: number | null;
  acceptedAt: string | null;
  completedAt: string | null;
  reversedAt: string | null;
  reverseReason: string | null;
  challengerTxnId: number | null;
  challengedTxnId: number | null;
  rounds: Array<{
    roundNumber: number;
    deadlineAt: string;
    challengerChoice: string | null;
    challengedChoice: string | null;
    challengerTimedOut: boolean;
    challengedTimedOut: boolean;
    winnerSide: string | null;
    revealedAt: string | null;
  }>;
}

export type TMinigameLobbyEvent =
  | { type: "challenge.incoming"; challenge: IMinigameChallengeDto }
  | { type: "challenge.updated"; challenge: IMinigameChallengeDto }
  | { type: "challenge.accepted"; challenge: IMinigameChallengeDto }
  | { type: "match.active"; minigameId: number }
  | { type: "match.finished"; challenge: IMinigameChallengeDto }
  | { type: "pong" };

export type TMinigameMatchEvent =
  | { type: "state"; match: IMinigameMatchDto }
  | { type: "pong" };
