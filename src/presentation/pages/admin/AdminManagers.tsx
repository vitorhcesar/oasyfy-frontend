import { useApiService } from "@/presentation/hooks/use-api-service";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
import { Input } from "@/presentation/components/ui/input";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { useUserContext } from "@/presentation/context/UserContext";
import { Loader2, Mail, Shield, Trash2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface IAdminUser {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export default function AdminManagers() {
  const apiService = useApiService();
  const user = useUserContext();
  const [admins, setAdmins] = useState<IAdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const managers = await apiService.modules.manageAdmins.listManagers();
      setAdmins(managers);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar administradores");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

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
      await apiService.modules.manageAdmins.execute({
        action: "add",
        email,
        password,
        full_name: fullName || null,
      });

      toast.success("Administrador adicionado com sucesso");
      setEmail("");
      setPassword("");
      setFullName("");
      fetchAdmins();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        toast.error(err.message || "Erro inesperado");
      } else {
        toast.error("Erro inesperado");
      }
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
      fetchAdmins();
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        toast.error(err.message || "Erro inesperado");
      } else {
        toast.error("Erro inesperado");
      }
    } finally {
      setRemoving(null);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Administradores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie quem tem acesso ao painel administrativo
          </p>
        </div>

        {/* Add new admin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus size={18} />
              Adicionar administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAdmin} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Nome (opcional)
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
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
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
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
                className="w-full sm:w-auto"
              >
                {adding ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                {adding ? "Adicionando..." : "Adicionar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield size={18} />
              Administradores ativos ({admins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 size={20} className="animate-spin mr-2" />
                Carregando...
              </div>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum administrador encontrado
              </p>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.user_id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Shield size={16} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {admin.full_name || "Sem nome"}
                          {admin.user_id === user?.id && (
                            <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                              (você)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
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
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
