import z from "zod";

export const phoneValidationSchema = z
  .string()
  .transform((v) => v.replace(/\s/g, ""))
  .refine(
    (v) => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v),
    "Insira um telefone válido. Ex: (11) 99999-9999"
  );
