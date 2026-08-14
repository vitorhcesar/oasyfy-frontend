import { Building2, ChevronRight, MailWarning, User } from "lucide-react";
import { useAdminKycPageStore } from "../stores/admin-kyc-page.store";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";
import { isPendingEmailVerification } from "../utils/is-pending-email-verification.util";
import { statusBadgeClasses } from "../utils/status-badge-classes.util";
import { statusDot } from "../utils/status-dot.util";
import { statusText } from "../utils/status-text.util";

interface ISubmissionsListProps {
  filteredSubmissions: IKycSubmissionView[];
  timeAgo: (date: string) => string;
  effectiveStatus: (submission: IKycSubmissionView) => string;
}

export default function SubmissionsList({
  filteredSubmissions,
  timeAgo,
  effectiveStatus,
}: ISubmissionsListProps) {
  const { setSelectedSeller } = useAdminKycPageStore();

  return (
    <div className="admin-surface overflow-hidden divide-y divide-border/50">
      {filteredSubmissions.map((submission) => {
        const status = effectiveStatus(submission);

        return (
          <button
            key={submission.id}
            onClick={() => setSelectedSeller(submission)}
            className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/25"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {submission.person_type === "pj" ? (
                <Building2 size={17} />
              ) : (
                <User size={17} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">
                {submission.full_name}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {submission.email || "—"}
              </p>
              <p className="truncate font-mono text-sm text-muted-foreground">
                {submission.person_type === "pf"
                  ? submission.cpf
                  : submission.cnpj || "—"}
              </p>
            </div>
            <span
              className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${statusBadgeClasses(status)}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`} />
              {statusText(status)}
            </span>
            {isPendingEmailVerification(submission) && (
              <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                <MailWarning size={12} />
                Aguardando OTP
              </span>
            )}
            <span className="w-12 flex-shrink-0 text-right text-sm text-muted-foreground">
              {timeAgo(submission.created_at)}
            </span>
            <ChevronRight
              size={16}
              className="flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
            />
          </button>
        );
      })}
    </div>
  );
}
