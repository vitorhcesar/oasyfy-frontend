export type TAcquirerConnectionCatalogItem = {
  name: string;
  status: string;
  is_active: boolean;
  methods: string[];
};

export type TAcquirerConnectionGroupKey =
  | "active"
  | "configured"
  | "unconfigured";

export const ACQUIRER_CONNECTION_GROUPS: Array<{
  key: TAcquirerConnectionGroupKey;
  title: string;
}> = [
  { key: "active", title: "Ativas" },
  { key: "configured", title: "Configuradas" },
  { key: "unconfigured", title: "Não configuradas" },
];

const METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  boleto: "Boleto",
  crypto: "Crypto",
  ted: "TED",
};

export function getAcquirerConnectionGroup(
  conn: Pick<TAcquirerConnectionCatalogItem, "status" | "is_active">,
): TAcquirerConnectionGroupKey {
  if (conn.is_active) {
    return "active";
  }
  if (conn.status === "connected") {
    return "configured";
  }
  return "unconfigured";
}

export function getAcquirerMethodLabel(method: string): string {
  return METHOD_LABELS[method.toLowerCase()] ?? method;
}

export function collectAcquirerMethods(
  connections: Array<Pick<TAcquirerConnectionCatalogItem, "methods">>,
): string[] {
  const methods = new Set<string>();
  for (const conn of connections) {
    for (const method of conn.methods) {
      const normalized = method.trim().toLowerCase();
      if (normalized) {
        methods.add(normalized);
      }
    }
  }
  return [...methods].sort();
}

export function filterAcquirerConnections<T extends TAcquirerConnectionCatalogItem>(
  connections: T[],
  nameQuery: string,
  methodFilter: string,
): T[] {
  const query = nameQuery.trim().toLowerCase();
  const method = methodFilter.trim().toLowerCase();

  return connections.filter((conn) => {
    const matchesName = !query || conn.name.toLowerCase().includes(query);
    const matchesMethod =
      !method ||
      method === "all" ||
      conn.methods.some((item) => item.toLowerCase() === method);
    return matchesName && matchesMethod;
  });
}

export function groupAcquirerConnections<T extends TAcquirerConnectionCatalogItem>(
  connections: T[],
): Record<TAcquirerConnectionGroupKey, T[]> {
  const groups: Record<TAcquirerConnectionGroupKey, T[]> = {
    active: [],
    configured: [],
    unconfigured: [],
  };

  for (const conn of connections) {
    groups[getAcquirerConnectionGroup(conn)].push(conn);
  }

  return groups;
}
