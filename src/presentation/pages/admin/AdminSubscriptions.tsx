import { UnderConstruction } from "@/presentation/components/UnderConstruction";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";

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
