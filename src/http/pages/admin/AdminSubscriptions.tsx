import { AdminLayout } from "@/http/components/admin/AdminLayout";
import { UnderConstruction } from "@/http/components/UnderConstruction";

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
