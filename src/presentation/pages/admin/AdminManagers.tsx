import PageHeader from "@/presentation/components/PageHeader";
import { Button } from "@/presentation/components/ui/button";
import { Input } from "@/presentation/components/ui/input";
import { useUserContext } from "@/presentation/context/UserContext";
import useAdminManagersQuery from "@/presentation/hooks/use-admin-managers-query";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { getErrorMessageOrDefault } from "@/presentation/utils/get-error-message-or-default";
import { Loader2, Mail, Shield, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminManagers() {
  const apiService = useApiService();
  const user = useUserContext();
  const {
    data: admins,
    isLoading: loading,
    isError,
    invalidateQuery,
  } = useAdminManagersQuery();

  useEffect(() => {
    if (isError) {
      toast.error("Não foi possível carregar a lista de administradores");
    }
  }, [isError]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }
    if (password.length < 8) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    setAdding(true);
    try {
      const trimmedName = fullName.trim();
      await apiService.modules.manageAdmins.execute({
        action: "add",
        email: email.trim(),
        password,
        ...(trimmedName ? { full_name: trimmedName } : {}),
      });

      toast.success("Administrador adicionado com sucesso");
      setEmail("");
      setPassword("");
      setFullName("");
      await invalidateQuery();
    } catch (err) {
      toast.error(
        getErrorMessageOrDefault(
          err,
          "Não foi possível adicionar o administrador",
        ),
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (targetUserId: string) => {
    if (targetUserId === user?.id) {
      toast.error("Você não pode remover a si mesmo");
      return;
    }

    setRemoving(targetUserId);
    try {
      await apiService.modules.manageAdmins.execute({
        action: "remove",
        target_user_id: Number(targetUserId),
      });

      toast.success("Administrador removido com sucesso");
      await invalidateQuery();
    } catch (err) {
      toast.error(
        getErrorMessageOrDefault(
          err,
          "Não foi possível remover o administrador",
        ),
      );
    } finally {
      setRemoving(null);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto w-full max-w-3xl space-y-6 px-5 py-6 md:px-8 md:py-9">
        <PageHeader
          eyebrow="Equipe"
          title="Administradores"
          description="Gerencie quem tem acesso ao painel administrativo"
          className="mb-0"
        />

        {/* Add new admin */}
        <div className="admin-surface p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <UserPlus size={18} />
            Adicionar administrador
          </h2>
          <form onSubmit={handleAddAdmin} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nome (opcional)
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              disabled={adding}
              className="w-full sm:w-auto !mt-2"
            >
              {adding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              {adding ? "Adicionando..." : "Adicionar"}
            </Button>
          </form>
        </div>

        {/* Admin list */}
        <div className="admin-surface p-5 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Shield size={18} />
            Administradores ativos ({admins.length})
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 size={24} className="mr-2 animate-spin" />
              Carregando...
            </div>
          ) : admins.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum administrador encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.user_id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-background p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Shield size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {admin.full_name || "Sem nome"}
                        {admin.user_id === user?.id && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            (você)
                          </span>
                        )}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Mail size={11} />
                        {admin.email}
                      </p>
                    </div>
                  </div>
                  {admin.user_id !== user?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAdmin(admin.user_id)}
                      disabled={removing === admin.user_id}
                      className="flex-shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      {removing === admin.user_id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
