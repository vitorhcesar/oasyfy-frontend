import { AppError } from "@/domain/errors/app.error";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessageOrDefault } from "./get-error-message-or-default";

function axiosError(data: unknown, status = 400): AxiosError {
  return new AxiosError(
    "Request failed with status code 400",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status,
      statusText: "Bad Request",
      data,
      headers: {},
      config: { headers: new AxiosHeaders() },
    },
  );
}

describe("getErrorMessageOrDefault", () => {
  it("prefers the string error details from the API envelope", () => {
    expect(
      getErrorMessageOrDefault(
        axiosError({
          status: 400,
          message: "Dados inválidos",
          error: "email: Formato de e-mail inválido",
          code: "validation",
        }),
        "Erro inesperado",
      ),
    ).toBe("email: Formato de e-mail inválido");
  });

  it("uses nested error.message when the API serializes an AppError", () => {
    expect(
      getErrorMessageOrDefault(
        axiosError({
          status: 400,
          message: "Este email já está cadastrado",
          error: { message: "Este email já está cadastrado", statusCode: 400 },
        }),
        "Erro inesperado",
      ),
    ).toBe("Este email já está cadastrado");
  });

  it("does not show the generic Axios status message", () => {
    expect(
      getErrorMessageOrDefault(
        axiosError(undefined),
        "Não foi possível adicionar o administrador",
      ),
    ).toBe("Não foi possível adicionar o administrador");
  });

  it("keeps AppError messages", () => {
    expect(
      getErrorMessageOrDefault(
        new AppError("Falha ao salvar", 400),
        "Erro inesperado",
      ),
    ).toBe("Falha ao salvar");
  });
});
