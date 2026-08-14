import { PublicRoute } from "@/presentation/components/auth/PublicRoute";
import { setLoginInFlight } from "@/presentation/components/auth/portal-login-lock";
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

function LoginTree({ ui }: { ui?: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route
          path="/login"
          element={<PublicRoute>{ui ?? <div>login-form</div>}</PublicRoute>}
        />
        <Route path="/admin" element={<div>admin-home</div>} />
        <Route path="/seller" element={<div>seller-home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function renderLogin(ui?: React.ReactNode) {
  return render(<LoginTree ui={ui} />);
}

describe("PublicRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLoginInFlight(false);
  });

  it("shows loading while the initial session is resolving", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({ isLoading: true, isAuthenticated: false }),
    );

    renderLogin();

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("shows loading while an authenticated session waits for the role", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        isLoading: true,
        isAuthenticated: true,
        role: null,
      }),
    );

    renderLogin();

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.queryByText("login-form")).not.toBeInTheDocument();
  });

  it("keeps the login form visible while a login is in flight", () => {
    setLoginInFlight(true);
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        isLoading: true,
        isAuthenticated: true,
        role: "admin",
      }),
    );

    renderLogin();

    expect(screen.getByText("login-form")).toBeInTheDocument();
    expect(screen.queryByText("admin-home")).not.toBeInTheDocument();
    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
  });

  it("does not redirect while login is in flight", () => {
    setLoginInFlight(true);
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        isLoading: false,
        isAuthenticated: true,
        role: "admin",
      }),
    );

    renderLogin();

    expect(screen.getByText("login-form")).toBeInTheDocument();
    expect(screen.queryByText("admin-home")).not.toBeInTheDocument();
  });

  it("redirects an already authenticated admin visiting login", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({
        isLoading: false,
        isAuthenticated: true,
        role: "admin",
      }),
    );

    renderLogin();

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

    renderLogin();

    expect(screen.getByText("seller-home")).toBeInTheDocument();
  });

  it("does not unmount the login form on a later session refetch", () => {
    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({ isLoading: false, isAuthenticated: false }),
    );

    const { rerender } = renderLogin();

    expect(screen.getByText("login-form")).toBeInTheDocument();

    mockedUseAuthContext.mockReturnValue(
      mockAuthContext({ isLoading: true, isAuthenticated: false }),
    );
    rerender(<LoginTree />);

    expect(screen.getByText("login-form")).toBeInTheDocument();
    expect(screen.queryByText("Carregando...")).not.toBeInTheDocument();
  });
});
