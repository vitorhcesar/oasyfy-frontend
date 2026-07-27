import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";

export default function LoginSellerMobileLogo() {
  return (
    <div className="mb-10 lg:hidden animate-auth-reveal-up">
      <AuthBrandMark size="lg" variant="white" />
      <p className="mt-2 text-sm text-muted-foreground">
        Plataforma de pagamentos
      </p>
    </div>
  );
}
