import { statusBadgeClasses } from "../utils/status-badge-classes.util";
import { statusDot } from "../utils/status-dot.util";
import { statusText } from "../utils/status-text.util";

interface IStatusPillProps {
  status: string;
}

export function StatusPill({ status }: IStatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(status)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`} />
      {statusText(status)}
    </span>
  );
}
