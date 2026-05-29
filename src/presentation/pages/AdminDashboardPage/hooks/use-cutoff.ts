import { useMemo } from "react";
import { TAdminDashboardPeriod } from "../types/admin-dashboard-period.type";

interface IUseCutoffProps {
  period: TAdminDashboardPeriod;
  customFrom: Date | undefined;
  customTo: Date | undefined;
}

export default function useCutoff({
  period,
  customFrom,
  customTo,
}: IUseCutoffProps) {
  const cutoff = useMemo(() => {
    if (period === "custom" && customFrom) return customFrom;
    const periodMs =
      period === "7d"
        ? 7 * 86400000
        : period === "30d"
          ? 30 * 86400000
          : 90 * 86400000;
    return new Date(Date.now() - periodMs);
  }, [period, customFrom]);

  const cutoffEnd = useMemo(() => {
    if (period === "custom" && customTo) {
      const end = new Date(customTo);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    return new Date();
  }, [period, customTo]);

  return {
    cutoff,
    cutoffEnd,
  };
}
