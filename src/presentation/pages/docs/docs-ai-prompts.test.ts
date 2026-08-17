import { describe, expect, test } from "vitest";
import { DOCS_NAV } from "./docs-nav";
import { getDocsAiPrompt } from "./docs-ai-prompts";

describe("docs AI prompts", () => {
  test("covers every sidebar page", () => {
    const missing = DOCS_NAV.flatMap((group) => group.items)
      .map((item) => item.slug)
      .filter((slug) => !getDocsAiPrompt(slug));

    expect(missing).toEqual([]);
  });

  test("full integration prompt includes the main endpoints", () => {
    const prompt = getDocsAiPrompt("integrar-com-ia") ?? "";
    expect(prompt).toContain("Integração completa com a API Oasyfy");
    expect(prompt).toContain("/gateway/pix");
    expect(prompt).toContain("sale.status_changed");
    expect(prompt).toContain("/gateway/withdrawals");
    expect(prompt).toContain("/healthcheck");
  });

  test("PIX prompt includes required fields and document", () => {
    const prompt = getDocsAiPrompt("venda/pix") ?? "";
    expect(prompt).toContain("POST");
    expect(prompt).toContain("/gateway/pix");
    expect(prompt).toContain("customer_name");
    expect(prompt).toContain("customer_document");
    expect(prompt).toContain("amount");
  });
});
