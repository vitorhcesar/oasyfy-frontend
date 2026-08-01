export type TSellerDashboardTimeRange = "today" | "7d" | "30d" | "custom";

export const SELLER_DASHBOARD_PRESET_RANGES: {
  value: Exclude<TSellerDashboardTimeRange, "custom">;
  label: string;
}[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
];
