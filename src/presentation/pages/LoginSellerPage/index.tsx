import LoginSellerFormPanel from "./components/FormPanel";
import LoginSellerLeftPanel from "./components/LeftPanel";

export default function LoginSellerPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <LoginSellerLeftPanel />
      <LoginSellerFormPanel />
    </div>
  );
}
