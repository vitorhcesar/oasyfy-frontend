export interface IClientIpService {
  getClientIp: () => Promise<string | null>;
}
