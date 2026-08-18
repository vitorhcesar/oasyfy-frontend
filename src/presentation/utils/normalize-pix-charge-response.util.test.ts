import { describe, expect, it } from "vitest";
import { normalizePixChargeResponse } from "./normalize-pix-charge-response.util";

describe("normalizePixChargeResponse", () => {
  it("reads Woovi charge image and brCode", () => {
    const normalized = normalizePixChargeResponse({
      woovi_charge: {
        brCode: "000201woovi",
        qrCodeImage: "https://api.woovi.com/qr.png",
      },
    });
    expect(normalized.pixCode).toBe("000201woovi");
    expect(normalized.qrCodeImage).toBe("https://api.woovi.com/qr.png");
  });

  it("reads OnlyUp pixCopiaECola without requiring a QR image", () => {
    const normalized = normalizePixChargeResponse({
      txid: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
      pixCopiaECola: "000201onlyup",
      brCode: "000201onlyup",
      onlyup_charge: {
        txid: "aaaaaaaaaaaaaaaaaaaaaaaaaa",
        pixCopiaECola: "000201onlyup",
      },
      _routing: { acquirer: "OnlyUp", provider: "onlyup" },
    });
    expect(normalized.pixCode).toBe("000201onlyup");
    expect(normalized.qrCodeImage).toBe("");
    expect(normalized.acquirer).toBe("OnlyUp");
    expect(normalized.provider).toBe("onlyup");
  });
});
