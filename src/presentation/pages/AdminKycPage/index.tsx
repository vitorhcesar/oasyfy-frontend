import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";
import { AdminKycDetails } from "./components/AdminKycDetails";
import AdminKycPageContent from "./components/AdminKycPageContent";
import AdminKycPageHeader from "./components/AdminKycPageHeader";
import Filters from "./components/Filters";
import useAdminKycSubmissionsQuery from "./hooks/use-admin-kyc-submissions-query";
import { useAdminKycPageStore } from "./stores/admin-kyc-page.store";
import {
  mapAdminKycSubmissionToView,
  mapRegisteredSellerToKycView,
  mapRegisteredSellerToView,
} from "./utils/map-admin-kyc-submissions-to-view.util";

export default function AdminKycPage() {
  const { filter, search, selectedSeller, setSelectedSeller } =
    useAdminKycPageStore();

  const { data, isLoading, refetch, invalidateQuery } =
    useAdminKycSubmissionsQuery(filter);

  const submissions = useMemo(
    () => data.submissions.map(mapAdminKycSubmissionToView),
    [data.submissions],
  );

  const registeredOnly = useMemo(
    () => data.registeredOnly.map(mapRegisteredSellerToView),
    [data.registeredOnly],
  );

  const filteredSubmissions = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          !search ||
          submission.full_name.toLowerCase().includes(search.toLowerCase()) ||
          submission.cpf?.includes(search) ||
          submission.cnpj?.includes(search) ||
          submission.account_id?.toLowerCase().includes(search.toLowerCase()),
      ),
    [search, submissions],
  );

  const filteredRegistered = useMemo(
    () =>
      registeredOnly.filter(
        (seller) =>
          !search ||
          seller.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          seller.account_id?.toLowerCase().includes(search.toLowerCase()) ||
          seller.user_id.includes(search),
      ),
    [registeredOnly, search],
  );

  const totalCount =
    filter === "registered"
      ? filteredRegistered.length
      : filter === "all"
        ? filteredSubmissions.length + filteredRegistered.length
        : filteredSubmissions.length;

  const pendingCount = submissions.filter(
    (submission) =>
      submission.status === "pending" || submission.status === "under_review",
  ).length;

  const syncSelectedSeller = async () => {
    const result = await refetch();
    if (!selectedSeller || !result.data) return;

    if (selectedSeller.id) {
      const updatedSubmission = result.data.submissions.find(
        (submission) => String(submission.id) === selectedSeller.id,
      );
      if (updatedSubmission) {
        setSelectedSeller(mapAdminKycSubmissionToView(updatedSubmission));
      }
      return;
    }

    const updatedRegistered = result.data.registeredOnly.find(
      (seller) => String(seller.userId) === selectedSeller.user_id,
    );
    if (updatedRegistered) {
      setSelectedSeller(
        mapRegisteredSellerToKycView(
          mapRegisteredSellerToView(updatedRegistered),
        ),
      );
    }
  };

  if (selectedSeller) {
    return (
      <AdminLayout>
        <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
          <AdminKycDetails
            submission={selectedSeller}
            onBack={async () => {
              setSelectedSeller(null);
              await invalidateQuery();
            }}
            onUpdate={syncSelectedSeller}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-8 md:py-9">
        <AdminKycPageHeader
          totalCount={totalCount}
          pendingCount={pendingCount}
        />

        <Filters />

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <AdminKycPageContent
            filteredRegistered={filteredRegistered}
            filteredSubmissions={filteredSubmissions}
          />
        )}
      </div>
    </AdminLayout>
  );
}
