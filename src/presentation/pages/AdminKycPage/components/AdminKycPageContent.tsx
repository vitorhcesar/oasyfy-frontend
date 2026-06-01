import { useAdminKycPageStore } from "../stores/admin-kyc-page.store";
import {
  IKycSubmissionView,
  IRegisteredSellerView,
} from "../types/kyc-submission-view.type";
import EmptyState from "./EmptyState";
import RegisteredList from "./RegisteredList";
import SubmissionsList from "./SubmissionsList";

const effectiveStatus = (submission: IKycSubmissionView) => {
  const allApproved =
    submission.status === "approved" &&
    submission.documents_status === "approved" &&
    submission.bank_status === "approved" &&
    submission.address_status === "approved";

  return allApproved
    ? "approved"
    : submission.status === "rejected"
      ? "rejected"
      : "pending";
};

const timeAgo = (date: string) => {
  if (!date) return "—";
  const diffMs = Date.now() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  return "agora";
};

interface IAdminKycPageContentProps {
  filteredRegistered: IRegisteredSellerView[];
  filteredSubmissions: IKycSubmissionView[];
}

export default function AdminKycPageContent({
  filteredRegistered,
  filteredSubmissions,
}: IAdminKycPageContentProps) {
  const { filter } = useAdminKycPageStore();

  switch (filter) {
    case "registered":
      if (filteredRegistered.length === 0)
        return (
          <EmptyState message="Nenhum usuário cadastrado sem documentos." />
        );
      return (
        <RegisteredList
          filteredRegistered={filteredRegistered}
          timeAgo={timeAgo}
        />
      );
    case "all":
      if (filteredSubmissions.length === 0 && filteredRegistered.length === 0)
        return <EmptyState />;
      return (
        <div className="space-y-6">
          <SubmissionsList
            filteredSubmissions={filteredSubmissions}
            timeAgo={timeAgo}
            effectiveStatus={effectiveStatus}
          />
          <RegisteredList
            filteredRegistered={filteredRegistered}
            timeAgo={timeAgo}
          />
        </div>
      );
    default:
      if (filteredSubmissions.length === 0) return <EmptyState />;
      return (
        <SubmissionsList
          filteredSubmissions={filteredSubmissions}
          timeAgo={timeAgo}
          effectiveStatus={effectiveStatus}
        />
      );
  }
}
