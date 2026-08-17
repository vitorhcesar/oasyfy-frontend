import { describe, expect, test } from "vitest";
import { findDocsNeighbors, listDocsNavItems } from "./docs-nav";

describe("findDocsNeighbors", () => {
  test("has no previous on the first page", () => {
    const { previous, next } = findDocsNeighbors("");
    expect(previous).toBeNull();
    expect(next?.title).toBe("Integrar com IA");
  });

  test("links middle pages to both sides", () => {
    const { previous, next } = findDocsNeighbors("integrar-com-ia");
    expect(previous?.title).toBe("Introdução");
    expect(next?.title).toBe("Autenticação");
  });

  test("has no next on the last page", () => {
    const items = listDocsNavItems();
    const last = items[items.length - 1];
    const { previous, next } = findDocsNeighbors(last.slug);
    expect(previous).not.toBeNull();
    expect(next).toBeNull();
  });
});
