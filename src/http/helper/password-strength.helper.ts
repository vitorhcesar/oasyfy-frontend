export interface IPasswordStrength {
  getPasswordChecks: (password: string) => { label: string; ok: boolean }[];
  checkPasswordIsStrong: (password: string) => boolean;
  getPasswordScore: (password: string) => number;
  getStrengthLabel: (password: string) => string;
  getStrengthColor: (password: string) => string;
}

export class PasswordStrengthHelper implements IPasswordStrength {
  getPasswordChecks(password: string) {
    const passwordChecks = [
      { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
      { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
      { label: "Letra minúscula", ok: /[a-z]/.test(password) },
      { label: "Número", ok: /\d/.test(password) },
      { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(password) },
    ];
    return passwordChecks;
  }

  checkPasswordIsStrong(password: string) {
    const passwordChecks = this.getPasswordChecks(password);
    return passwordChecks.every((c) => c.ok);
  }

  getPasswordScore(password: string) {
    const passwordChecks = this.getPasswordChecks(password);
    return passwordChecks.filter((c) => c.ok).length;
  }

  getStrengthLabel(password: string) {
    const passwordScore = this.getPasswordScore(password);
    return passwordScore <= 1
      ? "Muito fraca"
      : passwordScore <= 2
      ? "Fraca"
      : passwordScore <= 3
      ? "Média"
      : passwordScore <= 4
      ? "Forte"
      : "Muito forte";
  }

  getStrengthColor(password: string) {
    const passwordScore = this.getPasswordScore(password);
    return passwordScore <= 1
      ? "bg-destructive"
      : passwordScore <= 2
      ? "bg-destructive/70"
      : passwordScore <= 3
      ? "bg-warning"
      : passwordScore <= 4
      ? "bg-primary/70"
      : "bg-primary";
  }
}
