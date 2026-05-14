import { HttpClient, IHttpClient } from "../../http-client";
import { brazilZipCodeAxios } from "./axios-instance";
import { AddressModule, IAddressModule } from "./modules/address.module";

export interface IBrazilZipCodeServiceModules {
  address: IAddressModule;
}

export interface IBrazilZipCodeService {
  modules: IBrazilZipCodeServiceModules;
}

export class BrazilZipCodeService implements IBrazilZipCodeService {
  private readonly httpClient: IHttpClient;

  modules: IBrazilZipCodeServiceModules;

  constructor() {
    this.httpClient = new HttpClient(brazilZipCodeAxios);

    this.modules = {
      address: new AddressModule(this.httpClient),
    };
  }
}

export const brazilZipCodeService = new BrazilZipCodeService();
