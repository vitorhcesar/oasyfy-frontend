import { act, render, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "./sonner";

vi.mock("@/presentation/hooks/use-theme", () => ({
  useThemeContext: () => ({ theme: "dark", toggleTheme: vi.fn() }),
}));

function mockMatchMedia(isDesktop: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("min-width: 768px") ? isDesktop : !isDesktop,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList;
}

describe("Toaster", () => {
  afterEach(() => {
    act(() => {
      toast.dismiss();
    });
  });

  it("places toasts at the top-center on mobile so they stay on screen", async () => {
    mockMatchMedia(false);
    render(<Toaster />);
    act(() => {
      toast.success("Salvo");
    });

    await waitFor(() => {
      const toaster = document.querySelector("[data-sonner-toaster]");
      expect(toaster).toHaveAttribute("data-y-position", "top");
      expect(toaster).toHaveAttribute("data-x-position", "center");
    });
  });

  it("keeps toasts at the bottom-right on desktop", async () => {
    mockMatchMedia(true);
    render(<Toaster />);
    act(() => {
      toast.success("Salvo");
    });

    await waitFor(() => {
      const toaster = document.querySelector("[data-sonner-toaster]");
      expect(toaster).toHaveAttribute("data-y-position", "bottom");
      expect(toaster).toHaveAttribute("data-x-position", "right");
    });
  });
});
