import { supabase } from "@/infra/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { create } from "zustand";

type AppRole = "admin" | "seller";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isBanned: boolean;
  setSession: (session: Session | null) => void;
  setRole: (role: AppRole | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  fetchRole: (userId: string) => Promise<AppRole | null>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  isBanned: false,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, role: null, isBanned: false });
  },
  fetchRole: async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role as AppRole);
    const role = roles.includes("admin")
      ? "admin"
      : roles.includes("seller")
      ? "seller"
      : null;

    // Check if seller is banned
    if (role === "seller") {
      const { data: kyc } = await supabase
        .from("kyc_submissions")
        .select("is_banned")
        .eq("user_id", userId)
        .limit(1);
      const banned =
        kyc && kyc.length > 0 && (kyc[0] as any).is_banned === true;
      set({ role, isBanned: !!banned });
    } else {
      set({ role, isBanned: false });
    }

    return role;
  },
}));
