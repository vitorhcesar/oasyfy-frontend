import { AdminLayout } from "@/presentation/components/admin/AdminLayout";
import { UnderConstruction } from "@/presentation/components/UnderConstruction";

export default function AdminSubscriptions() {
  return (
    <AdminLayout>
      <UnderConstruction
        title="Assinaturas"
        description="Gerencie as assinaturas da plataforma."
      />
    </AdminLayout>
  );
}
