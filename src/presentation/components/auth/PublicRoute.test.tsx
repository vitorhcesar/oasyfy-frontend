import { PublicRoute } from "@/presentation/components/auth/PublicRoute";
import { setPortalLoginInFlight } from "@/presentation/components/auth/portal-login-lock";
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

const mockedUseAuthContext = vi.mocked(useAuthContext);

function mockAuthContext(overrides: Partial<IAuthContext>): IAuthContext {
  return {
    isAuthenticated: false,
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

function renderSellerLogin(ui?: React.ReactNode) {
  render(
    <MemoryRouter initialEntries={["/login/seller"]}>
      <Routes>
        <Route
          path="/login/seller"
          element={
            <PublicRoute portal="seller">{ui ?? <div>seller-login</div>}</PublicRoute>
          }
        />
        <Route path="/admin" element={<div>admin-home</div>} />
        <Route path="/seller" element={<div>seller-home</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPortalLoginInFlight("seller", false);
    setPortalLoginInFlight("admin", false);
  });

  it("shows loading while the initial session is resolving", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({ isLoading: true, isAuthenticated: false }),
    );

    renderSellerLogin();

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("keeps the seller login form visible while a portal login is in flight", () => {
    setPortalLoginInFlight("seller", true);
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        isLoading: true,
        isAuthenticated: true,
        role: "admin",
      }),
    );

    renderSellerLogin();

    expect(screen.getByText("seller-login")).toBeInTheDocument();
    expect(screen.queryByText("admin-home")).not.toBeInTheDocument();
    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
  });

  it("does not redirect an admin to /admin while seller login is in flight", () => {
    setPortalLoginInFlight("seller", true);
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        isLoading: false,
        isAuthenticated: true,
        role: "admin",
      }),
    );

    renderSellerLogin();

    expect(screen.getByText("seller-login")).toBeInTheDocument();
    expect(screen.queryByText("admin-home")).not.toBeInTheDocument();
  });

  it("redirects an already authenticated admin visiting seller login", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        isLoading: false,
        isAuthenticated: true,
        role: "admin",
      }),
    );

    renderSellerLogin();

    expect(screen.getByText("admin-home")).toBeInTheDocument();
  });

  it("redirects an authenticated seller to the seller dashboard", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        isLoading: false,
        isAuthenticated: true,
        role: "seller",
      }),
    );

    renderSellerLogin();

    expect(screen.getByText("seller-home")).toBeInTheDocument();
  });
});
