import { AppError } from "@/domain/errors/app.error";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import z from "zod";
import { KycOnboardingTypes } from "../types";
import { isValidCnpj } from "../utils/is-valid-cnpj";
import { isValidCpf } from "../utils/is-valid-cpf";

function throwError(message: string) {
  throw new AppError(message, 400);
}

function getErrorMessage(error: unknown) {
  return getErrorMessageOrDefault(error, "Erro ao validar o formulário");
}

function validateTypeStep(form: KycOnboardingTypes.IFormData) {
  if (!form.personType) {
    throwError("Selecione o tipo de pessoa");
  }
}

function validatePersonalStep(
  form: KycOnboardingTypes.IFormData,
  isPj: boolean,
) {
  if (isPj) {
    const schema = z.object({
      cnpj: z
        .string()
        .transform((v) => v.replace(/\D/g, ""))
        .refine((v) => v.length === 14, "CNPJ incompleto")
        .refine((v) => isValidCnpj(v), "CNPJ inválido — verifique os dígitos"),
      companyName: z.string().min(1, "Razão social é obrigatória"),
      companyType: z.string().min(1, "Tipo de empresa é obrigatório"),
    });

    const result = schema.safeParse({
      cnpj: form.cnpj,
      companyName: form.companyName,
      companyType: form.companyType,
    });

    if (!result.success) {
      throwError(getErrorMessage(result.error));
    }
    return;
  }

  const schema = z.object({
    cpf: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length === 11, "CPF incompleto")
      .refine((v) => isValidCpf(v), "CPF inválido — verifique os dígitos"),
  });

  const result = schema.safeParse({
    cpf: form.cpf,
  });

  if (!result.success) {
    throwError(getErrorMessage(result.error));
  }
}

export function validateAddressStep(form: KycOnboardingTypes.IFormData) {
  const schema = z.object({
    zipCode: z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length === 8, "CEP incompleto"),
    street: z.string().min(1, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(1, "Estado é obrigatório"),
  });

  const result = schema.safeParse({
    zipCode: form.zipCode,
    street: form.street,
    number: form.number,
    neighborhood: form.neighborhood,
    city: form.city,
    state: form.state,
  });

  if (!result.success) {
    throwError(getErrorMessage(result.error));
  }
}

function validateDocumentsStep(
  files: Record<string, KycOnboardingTypes.IUploadedFile>,
  isPj: boolean,
) {
  const uploadedFileSchema = z.object({
    file: z.instanceof(File).refine((file) => {
      if (
        file.type === "image/png" ||
        file.type === "image/webp" ||
        file.type === "image/jpeg" ||
        file.type === "image/jpg"
      ) {
        return file.size <= 10 * 1024 * 1024;
      }

      return false;
    }),
    preview: z.string(),
  });

  const schema = z.object({
    document_front: uploadedFileSchema,
    document_back: uploadedFileSchema,
    selfie: uploadedFileSchema,
  });

  const result = schema.safeParse(files);

  if (!result.success) {
    throwError(getErrorMessage(result.error));
  }

  if (isPj && !files.company_contract) {
    throwError("Contrato social é obrigatório");
  }

  if (isPj && files.company_contract) {
    const companyContractResult = uploadedFileSchema.safeParse(
      files.company_contract,
    );
    if (!companyContractResult.success) {
      throwError(getErrorMessage(companyContractResult.error));
    }
  }
}

export function validateBankStep(form: KycOnboardingTypes.IFormData) {
  const pixKeyTypeSchema = z
    .string()
    .min(1, "Tipo de chave PIX é obrigatório")
    .refine(
      (v) => ["cpf", "cnpj", "email", "phone"].includes(v),
      "Tipo de chave PIX inválido",
    );

  const bankSchema = z.object({
    bankName: z.string().min(1, "Nome do banco é obrigatório"),
    agency: z.string().min(1, "Agência é obrigatória"),
    account: z.string().min(1, "Conta é obrigatória"),
    accountType: z.string().min(1, "Tipo de conta é obrigatório"),
    pixKeyType: pixKeyTypeSchema,
    pixKey: z.string().min(1, "Chave PIX é obrigatória"),
  });

  const bankValidationResult = bankSchema.safeParse(form.bank);

  if (!bankValidationResult.success) {
    throwError(getErrorMessage(bankValidationResult.error));
  }

  if (form.bank.pixKeyType === "cpf") {
    if (!isValidCpf(form.bank.pixKey)) {
      throwError("CPF da chave PIX é inválido");
    }
  } else if (form.bank.pixKeyType === "cnpj") {
    if (!isValidCnpj(form.bank.pixKey)) {
      throwError("CNPJ da chave PIX é inválido");
    }
  } else if (form.bank.pixKeyType === "email") {
    if (!z.string().email().safeParse(form.bank.pixKey).success) {
      throwError("E-mail da chave PIX é inválido");
    }
  } else if (form.bank.pixKeyType === "phone") {
    if (form.bank.pixKey.replace(/\D/g, "").length < 10) {
      throwError("Telefone da chave PIX é inválido");
    }
  }
}

interface IValidateKycOnboardingStepProps {
  form: KycOnboardingTypes.IFormData;
  step: KycOnboardingTypes.TStep;
  files: Record<string, KycOnboardingTypes.IUploadedFile>;
}

export function validateKycOnboardingStep({
  form,
  step,
  files,
}: IValidateKycOnboardingStepProps) {
  const isPj = form.personType === "pj";

  switch (step) {
    case "review": {
      break;
    }
    case "type": {
      return validateTypeStep(form);
    }
    case "personal": {
      return validatePersonalStep(form, isPj);
    }
    case "documents": {
      return validateDocumentsStep(files, isPj);
    }
    default: {
      throwError("Passo não encontrado");
    }
  }
}

export function validateKycWithdrawalStep({
  form,
  step,
}: {
  form: KycOnboardingTypes.IFormData;
  step: KycOnboardingTypes.TWithdrawalStep;
}) {
  switch (step) {
    case "review": {
      break;
    }
    case "address": {
      return validateAddressStep(form);
    }
    case "bank": {
      return validateBankStep(form);
    }
    default: {
      throwError("Passo não encontrado");
    }
  }
}
