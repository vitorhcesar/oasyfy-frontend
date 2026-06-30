import { useApiService } from "@/presentation/hooks/use-api-service";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export type TAcquirerConnectionView = {
  id: string;
  name: string;
  logo_key: string | null;
  description: string | null;
  status: string;
  methods: string[];
  api_url: string;
  client_id: string;
  access_token: string;
  hmac_key: string;
  branch_id: string;
  account_number: string;
  is_active: boolean;
};

const DEFAULT_RETURN: TAcquirerConnectionView[] = [];
const QUERY_KEY = ["admin", "acquirer-connections"] as const;

function mapConnection(row: Record<string, unknown>): TAcquirerConnectionView {
  const conn = row as unknown as TAcquirerConnectionView;
  return {
    ...conn,
    client_id: conn.client_id ?? "",
    access_token: conn.access_token ?? "",
    hmac_key: conn.hmac_key ?? "",
    branch_id: conn.branch_id ?? "",
    account_number: conn.account_number ?? "",
  };
}

export default function useAdminAcquirerConnectionsQuery() {
  const apiService = useApiService();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const data = await apiService.modules.adminConfig.listAcquirerConnections();
      return data.map((c) => mapConnection(c as Record<string, unknown>));
    },
  });

  const invalidateQuery = async () => {
    await queryClient.invalidateQueries({ queryKey: [...QUERY_KEY] });
  };

  return {
    ...query,
    data: query.data ?? DEFAULT_RETURN,
    invalidateQuery,
  };
}
