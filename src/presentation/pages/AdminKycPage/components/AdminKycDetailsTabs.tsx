import { cn } from "@/presentation/utils/cn";
import {
  hasSubmittedKycAddress,
  hasSubmittedKycBank,
} from "@/presentation/utils/kyc-section-display-status.util";
import { useAdminKycDetailsStore } from "../stores/admin-kyc-details.store";
import { TAdminKycDetailsTab } from "../types/admin-kyc-details-tab.type";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";

interface IAdminKycDetailsTabsProps {
  submission: IKycSubmissionView;
}

export default function AdminKycDetailsTabs({
  submission,
}: IAdminKycDetailsTabsProps) {
  const { tab, setTab } = useAdminKycDetailsStore();

  const docReview = (submission.documents_review || {}) as Record<
    string,
    { status: string }
  >;
  const docKeys = [
    "document_front",
    "document_back",
    "selfie",
    ...(submission.person_type === "pj" ? ["company_contract"] : []),
  ];
  const pendingDocs = docKeys.filter(
    (k) => !docReview[k] || docReview[k].status === "pending",
  ).length;
  const pendingKyc =
    hasSubmittedKycAddress({
      zipCode: submission.zip_code,
      street: submission.street,
    }) && submission.address_status === "pending"
      ? 1
      : 0;
  const pendingBank =
    hasSubmittedKycBank(submission.bank_data) &&
    submission.bank_status === "pending"
      ? 1
      : 0;

  const tabs: { key: TAdminKycDetailsTab; label: string; pending: number }[] = [
    { key: "kyc", label: "Endereço (saques)", pending: pendingKyc },
    { key: "documents", label: "Documentos (vendas)", pending: pendingDocs },
    { key: "bank", label: "Banco (saques)", pending: pendingBank },
    { key: "fees", label: "Taxas", pending: 0 },
    { key: "balance", label: "Saldo", pending: 0 },
  ];

  return (
    <div className="liquid-glass-control mb-6 flex flex-wrap items-center gap-0.5 rounded-2xl p-1">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={cn(
            "relative rounded-xl px-3.5 py-2 text-sm font-semibold transition-all",
            tab === t.key
              ? "bg-white text-[#111827] shadow-sm"
              : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
          )}
        >
          {t.label}
          {t.pending > 0 && (
            <span
              className={cn(
                "ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-bold leading-none",
                tab === t.key
                  ? "bg-[#0F0F10]/12 text-[#111827]"
                  : "bg-warning/15 text-warning",
              )}
            >
              {t.pending}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
