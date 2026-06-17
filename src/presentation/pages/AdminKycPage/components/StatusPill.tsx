import { statusDot } from "../utils/status-dot.util";
import { statusText } from "../utils/status-text.util";

interface IStatusPillProps {
  status: string;
}

export function StatusPill({ status }: IStatusPillProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground -mt-3">
      <span className={`w-1.5 h-1.5 rounded-full ${statusDot(status)}`} />
      {statusText(status)}
    </span>
  );
}
