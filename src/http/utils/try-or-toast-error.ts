import { toast } from "../hooks/use-toast";
import { getErrorMessageOrDefault } from "./get-error-message-or-default";

interface IOptions {
  defaultErrorTitle?: string;
  defaultErrorMessage?: string;
  errorFn?: (error: unknown) => void;
  finallyFn?: () => void;
}

export async function tryOrToastError<T>(
  fn: () => T | Promise<T>,
  options?: IOptions
) {
  const {
    finallyFn,
    errorFn,
    defaultErrorMessage = "Erro desconhecido, tente novamente mais tarde",
    defaultErrorTitle = "Erro inesperado",
  } = options ?? {};

  try {
    return await fn();
  } catch (error) {
    console.error(error);
    if (errorFn) {
      errorFn(error);
    }

    toast({
      title: defaultErrorTitle,
      description: getErrorMessageOrDefault(error, defaultErrorMessage),
      variant: "destructive",
    });
  } finally {
    finallyFn?.();
  }
}
