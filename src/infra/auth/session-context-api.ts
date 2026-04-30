import type { IApiEnvelope } from "../http/api-types";
import { httpClient } from "../http/http-client";

export interface ISessionContextDto {
  role: "admin" | "seller" | null;
  isBanned: boolean;
  emailManuallyApproved: boolean;
}

export async function fetchSessionContext(): Promise<ISessionContextDto> {
  const body = await httpClient.get<IApiEnvelope<ISessionContextDto>>(
    "/api/v1/session/context"
  );
  return body.data;
}
