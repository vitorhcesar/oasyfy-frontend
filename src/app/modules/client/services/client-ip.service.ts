import { IClientIpService } from "./client-ip.service.interface";

export class ClientIpService implements IClientIpService {
  private async fetchUserIP(): Promise<string | null> {
    try {
      const response = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.ip || null;
    } catch {
      return null;
    }
  }

  async getClientIp(): Promise<string | null> {
    return this.fetchUserIP();
  }
}
