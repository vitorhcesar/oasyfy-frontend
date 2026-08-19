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

function isGenericHttpStatusMessage(message: string): boolean {
  return /^Request failed with status code \d+$/i.test(message);
}

function messageFromApiErrorPayload(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  if ("error" in data) {
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }

    if (data.error && typeof data.error === "object" && "message" in data.error) {
      if (typeof data.error.message === "string" && data.error.message.trim()) {
        return data.error.message;
      }
    }
  }

  if ("message" in data && typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  return null;
}

function resolveErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof AxiosError) {
    const fromResponse = messageFromApiErrorPayload(error.response?.data);
    if (fromResponse) {
      return fromResponse;
    }
  }

  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof ZodError) {
    return zodErrorToMessage(error);
  }

  if (error instanceof Error) {
    if (isGenericHttpStatusMessage(error.message)) {
      return defaultMessage;
    }
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
