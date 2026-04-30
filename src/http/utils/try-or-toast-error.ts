import { toast } from "../hooks/use-toast";

interface IErrorProps {
  title: string;
  description: string;
}

interface IOptions {
  errorFn?: (error: unknown) => IErrorProps;
  finallyFn?: () => void;
}

function getErrorProps(error: unknown, options?: IOptions): IErrorProps {
  if (options?.errorFn) {
    return options.errorFn(error);
  }

  return {
    title: "Erro inesperado",
    description: "Ocorreu um erro inesperado, tente novamente mais tarde",
  };
}

export async function tryOrToastError(
  fn: () => Promise<void> | void,
  options?: IOptions
) {
  const finallyFn = options?.finallyFn ?? undefined;

  try {
    await fn();
  } catch (error) {
    console.error(error);
    const errorProps = getErrorProps(error, options);
    toast({
      title: errorProps.title,
      description: errorProps.description,
      variant: "destructive",
    });
  } finally {
    finallyFn?.();
  }
}
