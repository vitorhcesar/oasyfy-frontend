import { IHttpClient } from "@/infra/http/http-client";

export class BaseApiModule {
  constructor(private readonly httpClient: IHttpClient) {}

  protected getClient() {
    return this.httpClient;
  }
}
