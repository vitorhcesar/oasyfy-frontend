import { describe, expect, it } from "vitest";
import {
  collectAcquirerMethods,
  filterAcquirerConnections,
  getAcquirerConnectionGroup,
  getAcquirerMethodLabel,
  groupAcquirerConnections,
} from "./acquirer-connection-catalog.util";

describe("getAcquirerConnectionGroup", () => {
  it("groups active connections first", () => {
    expect(
      getAcquirerConnectionGroup({ is_active: true, status: "connected" }),
    ).toBe("active");
    expect(
      getAcquirerConnectionGroup({ is_active: true, status: "disconnected" }),
    ).toBe("active");
  });

  it("groups inactive connected connections as configured", () => {
    expect(
      getAcquirerConnectionGroup({ is_active: false, status: "connected" }),
    ).toBe("configured");
  });

  it("groups remaining connections as unconfigured", () => {
    expect(
      getAcquirerConnectionGroup({ is_active: false, status: "disconnected" }),
    ).toBe("unconfigured");
    expect(
      getAcquirerConnectionGroup({ is_active: false, status: "error" }),
    ).toBe("unconfigured");
  });
});

describe("getAcquirerMethodLabel", () => {
  it("translates known methods", () => {
    expect(getAcquirerMethodLabel("pix")).toBe("Pix");
    expect(getAcquirerMethodLabel("CARD")).toBe("Cartão");
    expect(getAcquirerMethodLabel("boleto")).toBe("Boleto");
  });

  it("keeps unknown methods as-is", () => {
    expect(getAcquirerMethodLabel("wallet")).toBe("wallet");
  });
});

describe("collectAcquirerMethods", () => {
  it("returns unique sorted methods", () => {
    expect(
      collectAcquirerMethods([
        { methods: ["pix", "card"] },
        { methods: ["PIX", "boleto"] },
      ]),
    ).toEqual(["boleto", "card", "pix"]);
  });
});

describe("filterAcquirerConnections", () => {
  const connections = [
    {
      name: "Bass Pago",
      status: "connected",
      is_active: true,
      methods: ["pix"],
    },
    {
      name: "OnlyUp",
      status: "connected",
      is_active: false,
      methods: ["pix", "card"],
    },
    {
      name: "AppMax",
      status: "disconnected",
      is_active: false,
      methods: ["boleto"],
    },
  ];

  it("filters by name", () => {
    expect(filterAcquirerConnections(connections, "bass", "all")).toEqual([
      connections[0],
    ]);
  });

  it("filters by method", () => {
    expect(filterAcquirerConnections(connections, "", "card")).toEqual([
      connections[1],
    ]);
  });
});

describe("groupAcquirerConnections", () => {
  it("splits connections into catalog groups", () => {
    const grouped = groupAcquirerConnections([
      {
        name: "Ativa",
        status: "connected",
        is_active: true,
        methods: ["pix"],
      },
      {
        name: "Configurada",
        status: "connected",
        is_active: false,
        methods: ["pix"],
      },
      {
        name: "Sem config",
        status: "disconnected",
        is_active: false,
        methods: ["pix"],
      },
    ]);

    expect(grouped.active.map((item) => item.name)).toEqual(["Ativa"]);
    expect(grouped.configured.map((item) => item.name)).toEqual(["Configurada"]);
    expect(grouped.unconfigured.map((item) => item.name)).toEqual([
      "Sem config",
    ]);
  });
});
