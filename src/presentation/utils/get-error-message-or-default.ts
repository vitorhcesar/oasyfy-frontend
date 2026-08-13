import { AppError } from "@/domain/errors/app.error";
import { AxiosError } from "axios";
import { ZodError } from "zod";
import { translateError } from "./translate-error";

function zodErrorToMessage(error: ZodError): string {
  if (error.issues.length > 0) {
    const firstIssue = error.issues[0];
    return firstIssue.message;
  }
  return "Ocorreu um erro de validação";
}

function resolveErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      if (error.response?.data && typeof error.response.data === "object") {
        const existsMessage =
          "message" in error.response.data &&
          typeof error.response.data.message === "string";
        if (existsMessage) {
          if (
            "error" in error.response.data &&
            typeof error.response.data.error === "object"
          ) {
            const existsMessageInError =
              "message" in error.response.data.error &&
              typeof error.response.data.error.message === "string";
            if (existsMessageInError) {
              return error.response.data.error.message;
            }
          }

          return error.response.data.message;
        }
      }
    }
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    return zodErrorToMessage(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (Array.isArray(error) && error.length > 0) {
    const firstError = error[0];
    const message = resolveErrorMessage(firstError, defaultMessage);
    if (message !== defaultMessage) {
      return message;
    }
    return defaultMessage;
  }

  return defaultMessage;
}

export function getErrorMessageOrDefault(
  error: unknown,
  defaultMessage: string
): string {
  return translateError(resolveErrorMessage(error, defaultMessage));
}
