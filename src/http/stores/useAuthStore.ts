import { authClient } from "@/infra/auth/auth-client";
import { fetchSessionContext } from "@/infra/auth/session-context-api";
import type { Session, User } from "better-auth/types";
import { create } from "zustand";

type AppRole = "admin" | "seller";

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isBanned: boolean;
  setAuthSession: (session: Session | null, user: User | null) => void;
  setLoading: (loading: boolean) => void;
  fetchRole: () => Promise<AppRole | null>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  isBanned: false,
  setAuthSession: (session, user) => set({ session, user }),
  setLoading: (loading) => set({ loading }),
  fetchRole: async () => {
    const { user } = get();
    if (!user?.id) {
      set({ role: null, isBanned: false });
      return null;
    }
    try {
      const ctx = await fetchSessionContext();
      set({
        role: ctx.role,
        isBanned: ctx.isBanned,
      });
      return ctx.role;
    } catch {
      set({ role: null, isBanned: false });
      return null;
    }
  },
  signOut: async () => {
    await authClient.signOut();
    set({
      user: null,
      session: null,
      role: null,
      isBanned: false,
    });
  },
}));
