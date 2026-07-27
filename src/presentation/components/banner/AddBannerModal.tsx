import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/presentation/components/ui/dialog";
import { useApiService } from "@/presentation/hooks/use-api-service";
import { cn } from "@/presentation/utils/cn";
import { tryOrToastError } from "@/presentation/utils/try-or-toast-error";
import { Image, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface IAddBannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvalidateQuery: () => Promise<void>;
}

export default function AddBannerModal({
  open,
  onOpenChange,
  onInvalidateQuery,
}: IAddBannerModalProps) {
  const apiService = useApiService();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

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

    await tryOrToastError(
      async () => {
        await apiService.modules.adminBanners.create(title, linkUrl, file);
        await onInvalidateQuery();

        toast.success("Banner adicionado");

        onOpenChange(false);

        setTimeout(() => {
          setTitle("");
          setLinkUrl("");
          setFile(null);
          setPreview(null);
        }, 200);
      },
      {
        defaultErrorMessage: "Erro ao adicionar banner",
        finallyFn: () => {
          setUploading(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  <Image size={20} className="text-muted-foreground/40 mb-2" />
                  <span className="text-xs text-muted-foreground">
                    Clique para selecionar
                  </span>
                  <span className="text-sm md:text-xs text-muted-foreground/60 mt-0.5">
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
                  : "bg-muted text-muted-foreground cursor-not-allowed",
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
  );
}
