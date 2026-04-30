import { AppError } from "@/domain/errors/app.error";
import { ZodError } from "zod";

function zodErrorToMessage(error: ZodError): string {
  if (error.issues.length > 0) {
    const firstIssue = error.issues[0];
    return firstIssue.message;
  }
  return "A validation error occurred";
}

export function getErrorMessageOrDefault(
  error: unknown,
  defaultMessage: string
): string {
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
    const message = getErrorMessageOrDefault(firstError, defaultMessage);
    if (message !== defaultMessage) {
      return message;
    }
    return defaultMessage;
  }

  return defaultMessage;
}
