import { useAdminKycDetailsStore } from "../stores/admin-kyc-details.store";
import { TAdminKycDetailsTab } from "../types/admin-kyc-details-tab.type";
import { IKycSubmissionView } from "../types/kyc-submission-view.type";

interface IAdminKycDetailsTabsProps {
  seller: IKycSubmissionView;
}

export default function AdminKycDetailsTabs({
  seller,
}: IAdminKycDetailsTabsProps) {
  const { tab, setTab } = useAdminKycDetailsStore();

  const docReview = (seller.documents_review || {}) as Record<
    string,
    { status: string }
  >;
  const docKeys = [
    "document_front",
    "document_back",
    "selfie",
    "proof_of_address",
    ...(seller.person_type === "pj" ? ["company_contract"] : []),
  ];
  const pendingDocs = docKeys.filter(
    (k) => !docReview[k] || docReview[k].status === "pending",
  ).length;
  const pendingKyc = seller.address_status === "pending" ? 1 : 0;
  const pendingBank = seller.bank_status === "pending" ? 1 : 0;

  const tabs: { key: TAdminKycDetailsTab; label: string; pending: number }[] = [
    { key: "kyc", label: "Cadastro", pending: pendingKyc },
    { key: "documents", label: "Documentos", pending: pendingDocs },
    { key: "bank", label: "Banco", pending: pendingBank },
    { key: "fees", label: "Taxas", pending: 0 },
    { key: "balance", label: "Saldo", pending: 0 },
  ];

  return (
    <div className="flex items-center gap-0 border-b border-border/40 mb-8">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`px-4 py-2.5 text-xs font-medium transition-colors relative ${
            tab === t.key
              ? "text-foreground"
              : "text-muted-foreground/60 hover:text-muted-foreground"
          }`}
        >
          {t.label}
          {t.pending > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-700 text-[11px] md:text-xs font-bold leading-none">
              {t.pending}
            </span>
          )}
          {tab === t.key && (
            <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
          )}
        </button>
      ))}
    </div>
  );
}
