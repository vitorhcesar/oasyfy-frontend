import { AuthAmbientBackground } from "@/presentation/components/auth/AuthAmbientBackground";
import LoginSellerFormPanel from "./components/FormPanel";
import LoginSellerLeftPanel from "./components/LeftPanel";

export default function LoginSellerPage() {
  return (
    <div className="auth-skin relative flex min-h-screen overflow-hidden bg-[#0F0F10] text-foreground">
      <AuthAmbientBackground />
      <div className="auth-enter relative z-10 flex min-h-screen w-full">
        <LoginSellerLeftPanel />
        <LoginSellerFormPanel />
      </div>
    </div>
  );
}
