import { statusDot } from "../utils/status-dot.util";
import { statusText } from "../utils/status-text.util";

interface IStatusPillProps {
  status: string;
}

function statusClasses(status: string) {
  if (status === "approved") {
    return "border-success/25 bg-success/10 text-success";
  }
  if (status === "rejected") {
    return "border-destructive/25 bg-destructive/10 text-destructive";
  }
  return "border-warning/25 bg-warning/10 text-warning";
}

export function StatusPill({ status }: IStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusClasses(status)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`} />
      {statusText(status)}
    </span>
  );
}
