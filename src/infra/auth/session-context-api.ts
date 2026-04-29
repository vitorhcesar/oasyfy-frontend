import type { ApiEnvelope } from "../http/api-types";
import { httpClient } from "../http/http-client";

export type SessionContextDto = {
  role: "admin" | "seller" | null;
  isBanned: boolean;
  emailManuallyApproved: boolean;
};

export async function fetchSessionContext(): Promise<SessionContextDto> {
  const body = await httpClient.get<ApiEnvelope<SessionContextDto>>(
    "/api/v1/session/context"
  );
  return body.data;
}
