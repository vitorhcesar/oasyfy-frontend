import { AlertCircle, CheckCircle2 } from "lucide-react";

interface IValidationBadgeProps {
  valid: boolean | null;
}

export default function ValidationBadge({ valid }: IValidationBadgeProps) {
  if (valid === null) return null;
  return valid ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={10} />
      Válido
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
      <AlertCircle size={10} />
      Inválido
    </span>
  );
}
