import { supabase } from "@/infra/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { cn } from "@/presentation/utils/cn";
import {
  ExternalLink,
  Image,
  Loader2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export function BannersTab() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBanners = async () => {
    const { data } = await supabase
      .from("banners")
      .select("*")
      .order("display_order", { ascending: true });
    setBanners((data as Banner[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (f.size > 120 * 1024 * 1024) {
      toast.error("Imagem deve ter no máximo 120MB");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleAdd = async () => {
    if (!file) {
      toast.error("Selecione uma imagem");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("banners")
        .upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage
        .from("banners")
        .getPublicUrl(path);
      const { error: insertErr } = await supabase.from("banners").insert({
        title: title || null,
        image_url: urlData.publicUrl,
        link_url: linkUrl || null,
        display_order: banners.length,
      });
      if (insertErr) throw insertErr;
      toast.success("Banner adicionado");
      setAddOpen(false);
      setTitle("");
      setLinkUrl("");
      setFile(null);
      setPreview(null);
      fetchBanners();
    } catch {
      toast.error("Erro ao adicionar banner");
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    await supabase
      .from("banners")
      .update({ is_active: !banner.is_active })
      .eq("id", banner.id);
    fetchBanners();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const banner = banners.find((b) => b.id === deleteId);
    if (banner) {
      const path = banner.image_url.split("/banners/")[1];
      if (path) await supabase.storage.from("banners").remove([path]);
    }
    await supabase.from("banners").delete().eq("id", deleteId);
    toast.success("Banner removido");
    setDeleteId(null);
    fetchBanners();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-muted-foreground">
          Gerencie os banners do dashboard dos sellers
        </p>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs md:text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={13} />
          Novo banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-xl border border-border/40 bg-card p-12 text-center">
          <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <Image className="text-muted-foreground/40" size={18} />
          </div>
          <p className="text-xs font-medium text-foreground mb-0.5">
            Nenhum banner
          </p>
          <p className="text-xs text-muted-foreground">
            Adicione banners para exibir no dashboard.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="rounded-xl bg-card border border-border/40 overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3">
                <div className="w-32 h-16 rounded-lg overflow-hidden bg-muted/30 shrink-0">
                  <img
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {banner.title || "Sem título"}
                  </p>
                  {banner.link_url && (
                    <a
                      href={banner.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline"
                    >
                      <ExternalLink size={9} /> {banner.link_url}
                    </a>
                  )}
                  <p className="text-[11px] md:text-xs text-muted-foreground mt-1">
                    Ordem: {banner.display_order} ·{" "}
                    {new Date(banner.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors",
                      banner.is_active
                        ? "text-primary hover:bg-primary/10"
                        : "text-muted-foreground hover:bg-muted/30"
                    )}
                    title={banner.is_active ? "Desativar" : "Ativar"}
                  >
                    {banner.is_active ? (
                      <ToggleRight size={18} />
                    ) : (
                      <ToggleLeft size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteId(banner.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <div className="p-6">
            <DialogHeader className="mb-5">
              <DialogTitle className="text-base font-semibold flex items-center gap-2">
                <Image size={16} className="text-primary" />
                Novo banner
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-xs md:text-sm font-medium text-foreground mb-1.5 block">
                  Imagem *
                </label>
                {preview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border/40">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                    />
                    <button
                      onClick={() => {
                        setFile(null);
                        setPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1 rounded-md bg-background/80 text-muted-foreground hover:text-destructive text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border/40 cursor-pointer hover:border-primary/30 transition-colors">
                    <Image
                      size={20}
                      className="text-muted-foreground/40 mb-2"
                    />
                    <span className="text-xs text-muted-foreground">
                      Clique para selecionar
                    </span>
                    <span className="text-[11px] md:text-xs text-muted-foreground/60 mt-0.5">
                      PNG, JPG até 120MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-foreground mb-1.5 block">
                  Título (opcional)
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Promoção de verão"
                  className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="text-xs md:text-sm font-medium text-foreground mb-1.5 block">
                  Link (opcional)
                </label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-border/40 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                disabled={!file || uploading}
                onClick={handleAdd}
                className={cn(
                  "w-full py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5",
                  file
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {uploading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  "Adicionar banner"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Remover banner
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground mt-2">
            Tem certeza que deseja remover este banner? Esta ação não pode ser
            desfeita.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => setDeleteId(null)}
              className="py-2 rounded-lg border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              className="py-2 rounded-lg bg-destructive text-destructive-foreground text-xs font-medium hover:opacity-90 transition-all"
            >
              Remover
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
