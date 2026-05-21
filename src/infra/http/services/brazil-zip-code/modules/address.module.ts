import { AppError } from "@/domain/errors/app.error";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import z from "zod";
import { BaseBrazilZipCodeModule } from "./base-brazil-zip-code.module";

const getAddressResponseSchema = z.object({
  logradouro: z.string().optional(),
  bairro: z.string().optional(),
  localidade: z.string().optional(),
  uf: z.string().optional(),
});

type TGetAddressResponse = z.infer<typeof getAddressResponseSchema>;

export interface IAddress {
  street: string | undefined;
  neighborhood: string | undefined;
  city: string | undefined;
  state: string | undefined;
}

export interface IAddressModule {
  getAddressByZipCode(zipCode: string): Promise<IAddress>;
}

export class AddressModule
  extends BaseBrazilZipCodeModule
  implements IAddressModule
{
  async getAddressByZipCode(zipCode: string): Promise<IAddress> {
    const res = await this.getClient().get<TGetAddressResponse>(
      `ws/${zipCode}/json/`
    );
    const result = getAddressResponseSchema.safeParse(res);
    if (!result.success) {
      throw new AppError(
        getErrorMessageOrDefault(result.error, "Invalid address"),
        400
      );
    }
    return {
      street: result.data.logradouro,
      neighborhood: result.data.bairro,
      city: result.data.localidade,
      state: result.data.uf,
    };
  }
}
