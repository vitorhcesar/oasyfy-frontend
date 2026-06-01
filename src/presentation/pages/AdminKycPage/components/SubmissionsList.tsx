import { Building2, ChevronRight, User } from "lucide-react";
import { useAdminKycPageStore } from "../stores/admin-kyc-page.store";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";

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
    <div className="border border-border/50 rounded-lg overflow-hidden divide-y divide-border/40">
      {filteredSubmissions.map((submission) => {
        const status = effectiveStatus(submission);
        return (
          <button
            key={submission.id}
            onClick={() => setSelectedSeller(submission)}
            className="w-full flex items-center gap-4 px-5 py-4 bg-card hover:bg-muted/30 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted text-muted-foreground">
              {submission.person_type === "pj" ? (
                <Building2 size={15} />
              ) : (
                <User size={15} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {submission.full_name}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">
                {submission.email || "—"}
              </p>
              <p className="text-xs md:text-sm text-muted-foreground/40 truncate font-mono">
                {submission.person_type === "pf"
                  ? submission.cpf
                  : submission.cnpj || "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`w-2 h-2 rounded-full ${
                  status === "approved"
                    ? "bg-primary"
                    : status === "rejected"
                      ? "bg-destructive"
                      : "bg-amber-500"
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  status === "approved"
                    ? "text-primary"
                    : status === "rejected"
                      ? "text-destructive"
                      : "text-amber-600"
                }`}
              >
                {status === "approved"
                  ? "Aprovado"
                  : status === "rejected"
                    ? "Recusado"
                    : "Pendente"}
              </span>
            </div>
            <span className="text-xs text-muted-foreground/40 flex-shrink-0 w-12 text-right">
              {timeAgo(submission.created_at)}
            </span>
            <ChevronRight
              size={14}
              className="text-muted-foreground/30 flex-shrink-0"
            />
          </button>
        );
      })}
    </div>
  );
}
