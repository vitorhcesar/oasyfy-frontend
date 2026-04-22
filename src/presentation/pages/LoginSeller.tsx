import { ClientIpService } from "@/app/modules/client/services/client-ip.service";
import { supabase } from "@/infrastructure/integrations/supabase/client";
import { translateError } from "@/presentation/utils/translate-error";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const clientIpService = new ClientIpService();

type TRecoveryStep = "email" | "code" | "newPassword";

export default function LoginSeller() {
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const navigate = useNavigate();

  // Recovery OTP state
  const [recoveryStep, setRecoveryStep] = useState<TRecoveryStep>("email");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Signup email verification state
  const [signupVerifyStep, setSignupVerifyStep] = useState<"idle" | "code">(
    "idle"
  );
  const [signupOtp, setSignupOtp] = useState(["", "", "", "", "", ""]);
  const [signupVerifyLoading, setSignupVerifyLoading] = useState(false);
  const [signupVerifyCountdown, setSignupVerifyCountdown] = useState(0);
  const signupOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const validatePhone = (v: string) =>
    /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v.replace(/\s/g, ""));

  const passwordChecks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Letra minúscula", ok: /[a-z]/.test(password) },
    { label: "Número", ok: /\d/.test(password) },
    { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const passwordStrong = passwordChecks.every((c) => c.ok);
  const passwordScore = passwordChecks.filter((c) => c.ok).length;
  const strengthLabel =
    passwordScore <= 1
      ? "Muito fraca"
      : passwordScore <= 2
      ? "Fraca"
      : passwordScore <= 3
      ? "Média"
      : passwordScore <= 4
      ? "Forte"
      : "Muito forte";
  const strengthColor =
    passwordScore <= 1
      ? "bg-destructive"
      : passwordScore <= 2
      ? "bg-destructive/70"
      : passwordScore <= 3
      ? "bg-warning"
      : passwordScore <= 4
      ? "bg-primary/70"
      : "bg-primary";

  // New password checks (for recovery)
  const newPwChecks = [
    { label: "Mínimo 8 caracteres", ok: newPassword.length >= 8 },
    { label: "Letra maiúscula", ok: /[A-Z]/.test(newPassword) },
    { label: "Letra minúscula", ok: /[a-z]/.test(newPassword) },
    { label: "Número", ok: /\d/.test(newPassword) },
    { label: "Caractere especial", ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];
  const newPwStrong = newPwChecks.every((c) => c.ok);
  const newPwScore = newPwChecks.filter((c) => c.ok).length;
  const newPwStrengthColor =
    newPwScore <= 1
      ? "bg-destructive"
      : newPwScore <= 2
      ? "bg-destructive/70"
      : newPwScore <= 3
      ? "bg-warning"
      : newPwScore <= 4
      ? "bg-primary/70"
      : "bg-primary";

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    const targetEmail = recoveryStep === "email" ? recoveryEmail : email;
    if (!validateEmail(targetEmail)) {
      setError("Insira um email válido");
      setLoading(false);
      return;
    }

    const { data, error: fnErr } = await supabase.functions.invoke(
      "send-recovery-code",
      {
        body: { email: targetEmail },
      }
    );

    if (fnErr || (data && data.error)) {
      setError(data?.error || fnErr?.message || "Erro ao enviar código");
      setLoading(false);
      return;
    }

    setRecoveryEmail(targetEmail);
    setRecoveryStep("code");
    setSuccess("Código enviado! Verifique sua caixa de entrada.");
    setLoading(false);
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const code = otpDigits.join("");

    if (code.length !== 6) {
      setError("Insira o código completo");
      setLoading(false);
      return;
    }
    if (!newPwStrong) {
      setError("A senha não atende os requisitos");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("As senhas não coincidem");
      setLoading(false);
      return;
    }

    const { data, error: fnErr } = await supabase.functions.invoke(
      "verify-recovery-code",
      {
        body: { email: recoveryEmail, code, new_password: newPassword },
      }
    );

    if (fnErr || (data && data.error)) {
      setError(data?.error || fnErr?.message || "Erro ao verificar código");
      setLoading(false);
      return;
    }

    setSuccess("Senha atualizada com sucesso! Redirecionando...");
    setLoading(false);
    setTimeout(() => {
      resetRecoveryState();
    }, 2000);
  };

  const resetRecoveryState = () => {
    setIsForgotPassword(false);
    setRecoveryStep("email");
    setRecoveryEmail("");
    setOtpDigits(["", "", "", "", "", ""]);
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setSuccess("");
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtpDigits(text.split(""));
      const last = document.getElementById("otp-5");
      last?.focus();
    }
  };

  const startSignupVerifyCountdown = () => {
    setSignupVerifyCountdown(60);
    const timer = setInterval(() => {
      setSignupVerifyCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const openSignupVerification = async (
    message = "Verifique seu e-mail para continuar."
  ) => {
    const { data: sendData, error: sendErr } = await supabase.functions.invoke(
      "send-signup-verification",
      {
        body: { email },
      }
    );

    if (sendErr || sendData?.error) {
      setError(
        sendData?.error ||
          sendErr?.message ||
          "Erro ao enviar código de verificação"
      );
      return false;
    }

    setSignupVerifyStep("code");
    setSignupOtp(["", "", "", "", "", ""]);
    setError("");
    setSuccess(message);
    startSignupVerifyCountdown();
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    if (isForgotPassword) {
      if (recoveryStep === "email") {
        await handleSendCode(e);
        return;
      }
      if (recoveryStep === "code" || recoveryStep === "newPassword") {
        await handleVerifyAndReset(e);
        return;
      }
      return;
    }
    if (isSignUp) {
      if (!validateEmail(email)) {
        setError("Insira um email válido");
        setLoading(false);
        return;
      }
      if (!validatePhone(phone)) {
        setError("Insira um telefone válido. Ex: (11) 99999-9999");
        setLoading(false);
        return;
      }
      if (!passwordStrong) {
        setError("Sua senha não atende todos os requisitos de segurança");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("As senhas não coincidem");
        setLoading(false);
        return;
      }

      try {
        const { data: rlData } = await supabase.functions.invoke(
          "check-rate-limit",
          {
            body: { action: "signup" },
          }
        );
        if (rlData && !rlData.allowed) {
          setError(
            rlData.message || "Muitas tentativas. Tente novamente mais tarde."
          );
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error(error);
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone, email_verified_custom: false },
          },
        });
      if (signUpError) {
        setError(translateError(signUpError.message));
        setLoading(false);
        return;
      }

      if (signUpData?.user) {
        await supabase.auth.signOut();
        const opened = await openSignupVerification(
          "Código enviado! Verifique sua caixa de entrada."
        );
        setLoading(false);
        if (!opened) return;
        return;
      }
      setLoading(false);
      return;
    }

    const ip = await clientIpService.getClientIp();
    if (!ip) {
      setError(
        "Erro ao identificar seu IP. Verifique sua conexão e tente novamente."
      );
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      if (
        authError.message === "Email not confirmed" ||
        (authError as { code?: string }).code === "email_not_confirmed"
      ) {
        const opened = await openSignupVerification();
        setLoading(false);
        if (!opened) return;
        return;
      }
      setError(translateError(authError.message));
      setLoading(false);
      return;
    }
    if (data.user) {
      const emailVerifiedCustom =
        data.user.user_metadata?.email_verified_custom;
      const { data: profile } = await supabase
        .from("profiles")
        .select("email_manually_approved")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (emailVerifiedCustom === false && !profile?.email_manually_approved) {
        await supabase.auth.signOut();
        const opened = await openSignupVerification();
        setLoading(false);
        if (!opened) return;
        return;
      }

      await supabase.from("login_logs").insert({
        user_id: data.user.id,
        ip_address: ip,
        user_agent: navigator.userAgent,
      });

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const userRoles = (roles ?? []).map((r) => r.role);
      if (userRoles.includes("admin") && !userRoles.includes("seller")) {
        await supabase.auth.signOut();
        setError("Esta conta é de administrador. Use o login de admin.");
        setLoading(false);
        return;
      }
      navigate("/seller");
    }
    setLoading(false);
  };

  const handleSignupOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...signupOtp];
    newOtp[index] = value;
    setSignupOtp(newOtp);
    if (value && index < 5) signupOtpRefs.current[index + 1]?.focus();
    const full = newOtp.join("");
    if (full.length === 6) handleVerifySignupCode(full);
  };

  const handleSignupOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !signupOtp[index] && index > 0) {
      signupOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleSignupOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setSignupOtp(text.split(""));
      handleVerifySignupCode(text);
    }
  };

  const handleVerifySignupCode = async (code: string) => {
    setSignupVerifyLoading(true);
    setError("");
    const { data: verifyData, error: verifyErr } =
      await supabase.functions.invoke("send-signup-verification", {
        body: { email, code, action: "verify" },
      });
    if (verifyErr || verifyData?.error) {
      setError(verifyData?.error || "Erro ao verificar código");
      setSignupVerifyLoading(false);
      return;
    }
    setSuccess("E-mail verificado com sucesso! Redirecionando...");
    setSignupVerifyLoading(false);
    setTimeout(async () => {
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) {
        setError("E-mail verificado! Faça login para continuar.");
        setSignupVerifyStep("idle");
        setIsSignUp(false);
        return;
      }
      navigate("/seller");
    }, 1500);
  };

  const handleResendSignupCode = async () => {
    setError("");
    setSignupVerifyLoading(true);
    const opened = await openSignupVerification("Código reenviado!");
    setSignupVerifyLoading(false);
    if (!opened) return;
  };

  const features = [
    {
      icon: Zap,
      title: "Pagamentos instantâneos",
      desc: "Receba via PIX em segundos",
    },
    {
      icon: Shield,
      title: "Segurança total",
      desc: "Criptografia de ponta a ponta",
    },
    {
      icon: CreditCard,
      title: "Taxas competitivas",
      desc: "As melhores taxas do mercado",
    },
  ];

  const inputClass =
    "w-full pl-9 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

  // Recovery flow render
  const renderRecoveryContent = () => {
    if (recoveryStep === "email") {
      return (
        <>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="text-primary" size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Recuperar senha
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Informe seu email para receber um código de 6 dígitos
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={10} />
                </div>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-primary text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={10} />
                </div>
                <span>{success}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
                />
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Enviar código <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </>
      );
    }

    if (recoveryStep === "code") {
      const code = otpDigits.join("");
      return (
        <>
          <div className="mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <KeyRound className="text-primary" size={22} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Insira o código
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Enviamos um código de 6 dígitos para{" "}
              <span className="font-semibold text-foreground">
                {recoveryEmail}
              </span>
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length === 6) setRecoveryStep("newPassword");
              else setError("Insira o código completo");
            }}
            className="space-y-6"
          >
            {error && (
              <div className="px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={10} />
                </div>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-primary text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check size={10} />
                </div>
                <span>{success}</span>
              </div>
            )}
            <div
              className="flex justify-center gap-2.5"
              onPaste={handleOtpPaste}
            >
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-border/60 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                  autoFocus={i === 0}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={code.length !== 6}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Continuar <ArrowRight size={16} />
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleSendCode}
                className="text-xs text-primary/80 hover:text-primary font-medium transition-colors"
              >
                Reenviar código
              </button>
            </div>
          </form>
        </>
      );
    }

    // newPassword step
    return (
      <>
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Lock className="text-primary" size={22} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Nova senha
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Escolha uma nova senha segura para sua conta
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-destructive/5 border border-destructive/15 text-destructive text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
              <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <X size={10} />
              </div>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="px-4 py-3 rounded-xl bg-primary/5 border border-primary/15 text-primary text-[13px] font-medium flex items-start gap-2.5 animate-fade-in">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={10} />
              </div>
              <span>{success}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Nova senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
              />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass + " pr-11"}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        i < newPwScore ? newPwStrengthColor : "bg-border/40"
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {newPwChecks.map((c) => (
                    <p
                      key={c.label}
                      className={`text-[11px] flex items-center gap-1.5 transition-colors ${
                        c.ok
                          ? "text-primary font-medium"
                          : "text-muted-foreground/40"
                      }`}
                    >
                      {c.ok ? <Check size={10} /> : <X size={10} />} {c.label}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Confirmar nova senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
              />
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                Atualizar senha <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — clean, editorial */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between overflow-hidden bg-primary">
        <div className="relative z-10 flex flex-col justify-between h-full px-10 xl:px-14 py-10">
          {/* Top: Logo */}
          <div>
            <h2 className="text-xl font-bold text-primary-foreground tracking-tight">
              Oasyfy
            </h2>
          </div>

          {/* Center: Main copy */}
          <div className="max-w-sm">
            <p className="text-primary-foreground/60 text-xs font-semibold uppercase tracking-[0.2em] mb-4">
              Plataforma de pagamentos
            </p>
            <h1 className="text-[2.5rem] xl:text-5xl font-bold text-primary-foreground leading-[1.1] mb-6">
              Receba pagamentos
              <br />
              de forma simples.
            </h1>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
              PIX instantâneo, taxas justas e um painel completo para gerenciar
              suas vendas.
            </p>
          </div>

          {/* Bottom: Stats row */}
          <div className="flex items-center gap-8 text-primary-foreground/80">
            <div>
              <p className="text-2xl font-bold text-primary-foreground">
                2.5k+
              </p>
              <p className="text-xs text-primary-foreground/50 mt-0.5">
                Sellers ativos
              </p>
            </div>
            <div className="w-px h-8 bg-primary-foreground/15" />
            <div>
              <p className="text-2xl font-bold text-primary-foreground">
                99.9%
              </p>
              <p className="text-xs text-primary-foreground/50 mt-0.5">
                Uptime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Oasyfy
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Plataforma de pagamentos
            </p>
          </div>

          {signupVerifyStep === "code" ? (
            <div>
              <div className="mb-8">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="text-primary" size={20} />
                </div>
                <h1 className="text-xl font-semibold text-foreground">
                  Verifique seu e-mail
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Enviamos um código de 6 dígitos para{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-4 px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15 text-destructive text-[13px] flex items-center gap-2">
                  <X size={14} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="mb-4 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15 text-primary text-[13px] flex items-center gap-2">
                  <Check size={14} className="flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div
                className="flex items-center justify-center gap-2.5 mb-6"
                onPaste={handleSignupOtpPaste}
              >
                {signupOtp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      signupOtpRefs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleSignupOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleSignupOtpKeyDown(i, e)}
                    disabled={signupVerifyLoading}
                    className="w-11 h-12 text-center text-lg font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:opacity-50"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {signupVerifyLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <Loader2 size={14} className="animate-spin" />
                  Verificando...
                </div>
              )}

              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  {signupVerifyCountdown > 0 ? (
                    <>
                      Reenviar em{" "}
                      <span className="font-mono font-medium text-foreground">
                        {signupVerifyCountdown}s
                      </span>
                    </>
                  ) : (
                    "Não recebeu o código?"
                  )}
                </p>
                <button
                  type="button"
                  onClick={handleResendSignupCode}
                  disabled={signupVerifyLoading || signupVerifyCountdown > 0}
                  className="text-xs font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
                >
                  Reenviar código
                </button>
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    setSignupVerifyStep("idle");
                    setIsSignUp(false);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <ArrowLeft size={14} />
                  Voltar ao login
                </button>
              </div>
            </div>
          ) : isForgotPassword ? (
            <>
              {renderRecoveryContent()}
              <div className="text-center mt-8">
                <button
                  onClick={resetRecoveryState}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <ArrowLeft size={14} />
                  Voltar ao login
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-xl font-semibold text-foreground">
                  {isSignUp ? "Crie sua conta" : "Entrar"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isSignUp
                    ? "Preencha seus dados para começar"
                    : "Acesse sua conta para continuar"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15 text-destructive text-[13px] flex items-center gap-2">
                    <X size={14} className="flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15 text-primary text-[13px] flex items-center gap-2">
                    <Check size={14} className="flex-shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Nome completo
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                      />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder="João Silva"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="seu@email.com"
                    />
                  </div>
                  {isSignUp && email && !validateEmail(email) && (
                    <p className="text-xs text-destructive flex items-center gap-1 mt-1.5 pl-1">
                      <X size={11} /> Email inválido
                    </p>
                  )}
                </div>

                {isSignUp && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Telefone
                    </label>
                    <div className="relative">
                      <Phone
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                      />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className={inputClass}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    {phone && !validatePhone(phone) && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1.5 pl-1">
                        <X size={11} /> Telefone inválido
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className={inputClass + " pr-10"}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {isSignUp && password && (
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
                      <p className="text-[11px] text-muted-foreground">
                        Força:{" "}
                        <span className="font-medium text-foreground">
                          {strengthLabel}
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {passwordChecks.map((c) => (
                          <p
                            key={c.label}
                            className={`text-[11px] flex items-center gap-1 ${
                              c.ok ? "text-primary" : "text-muted-foreground/40"
                            }`}
                          >
                            {c.ok ? <Check size={10} /> : <X size={10} />}{" "}
                            {c.label}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isSignUp && (
                    <div className="text-right mt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setRecoveryEmail(email);
                          setError("");
                          setSuccess("");
                        }}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                  )}
                </div>

                {isSignUp && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className={inputClass}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? "Criar conta" : "Entrar"}{" "}
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isSignUp ? (
                    <>
                      Já tem conta?{" "}
                      <span className="text-primary font-medium">Entrar</span>
                    </>
                  ) : (
                    <>
                      Não tem conta?{" "}
                      <span className="text-primary font-medium">
                        Cadastre-se
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          <p className="text-center text-[11px] text-muted-foreground/50 mt-8">
            Ao continuar, você concorda com os Termos de Uso e Política de
            Privacidade.
          </p>
        </div>
      </div>
    </div>
  );
}
