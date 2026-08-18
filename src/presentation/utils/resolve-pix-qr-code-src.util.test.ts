import { describe, expect, it } from "vitest";
import { resolvePixQrCodeSrc } from "./resolve-pix-qr-code-src.util";

describe("resolvePixQrCodeSrc", () => {
  it("prefers a provided image URL", () => {
    expect(
      resolvePixQrCodeSrc({
        qrCodeImage: "https://api.woovi.com/qr.png",
        pixCode: "000201",
      }),
    ).toBe("https://api.woovi.com/qr.png");
  });

  it("prefixes raw base64 as a data URI", () => {
    expect(
      resolvePixQrCodeSrc({
        qrCodeImage: "abc123",
      }),
    ).toBe("data:image/png;base64,abc123");
  });

  it("keeps an existing data URI", () => {
    expect(
      resolvePixQrCodeSrc({
        qrCodeImage: "data:image/png;base64,abc",
      }),
    ).toBe("data:image/png;base64,abc");
  });

  it("builds a QR from the EMV when the acquirer has no image (OnlyUp)", () => {
    expect(
      resolvePixQrCodeSrc({
        pixCode: "00020126...",
        size: 220,
      }),
    ).toBe(
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=00020126...",
    );
  });

  it("returns empty when there is neither image nor PIX code", () => {
    expect(resolvePixQrCodeSrc({})).toBe("");
  });
});
