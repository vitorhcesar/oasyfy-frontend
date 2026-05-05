import { apiService } from "../http/services/api/api.service";
import type { ISessionContextDto } from "../http/services/api/modules/session.module";

export type { ISessionContextDto } from "../http/services/api/modules/session.module";

export async function fetchSessionContext(): Promise<ISessionContextDto> {
  return apiService.session.getContext();
}
