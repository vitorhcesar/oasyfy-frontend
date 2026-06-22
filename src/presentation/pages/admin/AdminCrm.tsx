import { useApiService } from "@/presentation/hooks/use-api-service";
import { AdminLayout } from "@/presentation/layouts/AdminLayout";
import { CheckCircle, Loader2, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CrmSettings {
  id: string;
  api_url: string;
  api_token: string;
  instance_name: string;
  welcome_message: string;
  is_active: boolean;
}

export default function AdminCrm() {
  const apiService = useApiService();
  const [settings, setSettings] = useState<CrmSettings>({
    id: "",
    api_url: "",
    api_token: "",
    instance_name: "",
    welcome_message:
      "Olá {name}! 🎉 Bem-vindo(a) à nossa plataforma! Sua conta foi verificada com sucesso. Estamos aqui para ajudá-lo(a) no que precisar.",
    is_active: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState("");

  useEffect(() => {
    const load = async () => {
      const data = await apiService.modules.adminConfig.getCrmSettings();
      if (data) setSettings(data as unknown as CrmSettings);
      setLoading(false);
    };
    load();
  }, [apiService]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await apiService.modules.adminConfig.updateCrmSettings({
        api_url: settings.api_url,
        api_token: settings.api_token,
        instance_name: settings.instance_name,
        welcome_message: settings.welcome_message,
        is_active: settings.is_active,
      });
      setSettings(saved as unknown as CrmSettings);
      toast.success("Configurações salvas");
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Informe um número");
      return;
    }
    setTesting(true);
    try {
      await apiService.modules.whatsapp.sendWelcome({
        phone: testPhone.trim(),
        name: "Teste",
        test: true,
      });
      toast.success("Mensagem de teste enviada!");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao enviar teste",
      );
    }
    setTesting(false);
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all";
  const labelClass =
    "text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block";

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 md:px-8 py-6 md:py-8 max-w-2xl mx-auto w-full">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Configurações
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            CRM WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure a integração com WhatsApp para envio automático de
            mensagem de boas-vindas
          </p>
        </div>

        <div className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Ativar CRM
                </p>
                <p className="text-xs text-muted-foreground">
                  Enviar mensagem de boas-vindas automaticamente ao seller
                  verificar o e-mail
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setSettings((s) => ({ ...s, is_active: !s.is_active }))
              }
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.is_active ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.is_active ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* API Config */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Conexão da API
            </h2>

            <div>
              <label className={labelClass}>URL da API</label>
              <input
                type="text"
                value={settings.api_url}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, api_url: e.target.value }))
                }
                placeholder="https://api.z-api.io ou Evolution API URL"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Token / API Key</label>
              <input
                type="password"
                value={settings.api_token}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, api_token: e.target.value }))
                }
                placeholder="Seu token de autenticação"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Nome da Instância</label>
              <input
                type="text"
                value={settings.instance_name}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, instance_name: e.target.value }))
                }
                placeholder="minha-instancia"
                className={inputClass}
              />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Mensagem de boas-vindas
            </h2>
            <p className="text-xs text-muted-foreground -mt-2">
              Use{" "}
              <code className="px-1 py-0.5 bg-muted rounded text-xs">
                {"{name}"}
              </code>{" "}
              para inserir o nome do seller
            </p>
            <textarea
              value={settings.welcome_message}
              onChange={(e) =>
                setSettings((s) => ({ ...s, welcome_message: e.target.value }))
              }
              rows={4}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Test */}
          <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              Testar envio
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5511999999999"
                className={`${inputClass} flex-1`}
              />
              <button
                onClick={handleTest}
                disabled={testing || !settings.api_url || !settings.api_token}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Enviar teste
              </button>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            Salvar configurações
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
