import type { User } from "better-auth/types";
import { ProtectedRoute } from "@/presentation/components/auth/ProtectedRoute";
import {
  useAuthContext,
  type IAuthContext,
} from "@/presentation/context/AuthContext";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/presentation/context/AuthContext", () => ({
  useAuthContext: vi.fn(),
}));

vi.mock("@/presentation/context/UserContext", () => ({
  UserContextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockedUseAuthContext = vi.mocked(useAuthContext);

const adminUser: User = {
  id: "1",
  email: "admin@test.com",
  name: "Admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  emailVerified: true,
};

function mockAuthContext(overrides: Partial<IAuthContext>): IAuthContext {
  return {
    isAuthenticated: Boolean(overrides.user),
    isLoading: false,
    user: null,
    session: null,
    role: null,
    isBanned: false,
    apiAccessEnabled: false,
    signOut: vi.fn(),
    ...overrides,
  };
}

function renderProtectedRoute(requiredRole?: "admin" | "seller") {
  render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>protected-content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login/seller" element={<div>seller-login</div>} />
        <Route path="/admin" element={<div>admin-home</div>} />
        <Route path="/seller" element={<div>seller-home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state while auth is resolving", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({ isLoading: true }),
    );

    renderProtectedRoute("admin");

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to seller login", () => {
    mockedUseAuthContext.mockReturnValue(mockAuthContext({}));

    renderProtectedRoute("admin");

    expect(screen.getByText("seller-login")).toBeInTheDocument();
  });

  it("renders children for authenticated users with the required role", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        user: adminUser,
        role: "admin",
        isAuthenticated: true,
      }),
    );

    renderProtectedRoute("admin");

    expect(screen.getByText("protected-content")).toBeInTheDocument();
  });
});
