import { Check, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { PasswordStrengthHelper } from "../helper/password-strength.helper";

const passwordStrengthHelper = new PasswordStrengthHelper();

interface IPasswordChecksProps {
  password: string;
  onChangePasswordIsStrong?: (isStrong: boolean) => void;
}

export function PasswordChecks({
  password,
  onChangePasswordIsStrong,
}: IPasswordChecksProps) {
  const passwordScore = useMemo(
    () => passwordStrengthHelper.getPasswordScore(password),
    [password]
  );
  const strengthColor = useMemo(
    () => passwordStrengthHelper.getStrengthColor(password),
    [password]
  );
  const strengthLabel = useMemo(
    () => passwordStrengthHelper.getStrengthLabel(password),
    [password]
  );
  const passwordChecks = useMemo(
    () => passwordStrengthHelper.getPasswordChecks(password),
    [password]
  );

  useEffect(() => {
    const passwordIsStrong =
      passwordStrengthHelper.checkPasswordIsStrong(password);
    if (onChangePasswordIsStrong) {
      onChangePasswordIsStrong(passwordIsStrong);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  return (
    <div className="mt-3 space-y-2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < passwordScore ? strengthColor : "bg-border"
            }`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Força:{" "}
        <span className="font-medium text-foreground">{strengthLabel}</span>
      </p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {passwordChecks.map((c) => (
          <p
            key={c.label}
            className={`text-sm flex items-center gap-1 ${
              c.ok ? "text-primary" : "text-muted-foreground/40"
            }`}
          >
            {c.ok ? <Check size={10} /> : <X size={10} />} {c.label}
          </p>
        ))}
      </div>
    </div>
  );
}
