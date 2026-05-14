import { useAuthStore } from "@/http/stores/useAuthStore";
import { supabase } from "@/infra/integrations/supabase/client";
import {
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback } from "react";
import { useKycOnboardingStore } from "./stores/kyc-onboarding.store";

interface IFileUploadBoxProps {
  id: string;
  label: string;
  labelClass: string;
  accept?: string;
}

function FileUploadBox({
  id,
  label,
  labelClass,
  accept = "image/*,.pdf",
}: IFileUploadBoxProps) {
  const { user } = useAuthStore();
  const { files, setFiles, setError } = useKycOnboardingStore();

  const f = files[id];

  const handleFileSelect = useCallback(
    async (key: string, file: File) => {
      if (!user) return;
      const preview = URL.createObjectURL(file);
      setFiles({
        ...files,
        [key]: { file, preview, uploading: true, url: null },
      });

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${key}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("kyc-documents")
        .upload(path, file);

      if (upErr) {
        setFiles({
          ...files,
          [key]: { ...files[key], uploading: false },
        });
        setError(`Erro ao enviar ${key}: ${upErr.message}`);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("kyc-documents")
        .getPublicUrl(path);

      setFiles({
        ...files,
        [key]: {
          ...files[key],
          uploading: false,
          url: urlData.publicUrl || path,
        },
      });
    },
    [user, files, setFiles, setError]
  );

  const removeFile = (key: string) => {
    if (files[key]?.preview) URL.revokeObjectURL(files[key].preview);
    const newFiles = { ...files };
    delete newFiles[key];
    setFiles(newFiles);
  };

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {f ? (
        <label className="relative rounded-xl border border-border/60 bg-card p-3 flex items-center gap-3 group hover:border-primary/30 transition-colors cursor-pointer">
          {f.preview && f.file.type.startsWith("image/") ? (
            <img
              src={f.preview}
              alt=""
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-border"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
              <FileText size={22} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {f.file.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {f.uploading ? (
                <span className="text-primary flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" />
                  Enviando...
                </span>
              ) : f.url ? (
                <span className="text-primary flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  Toque para trocar
                </span>
              ) : (
                "Erro no envio"
              )}
            </p>
          </div>
          {!f.uploading && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFile(id);
              }}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <input
            type="file"
            accept={accept}
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                removeFile(id);
                handleFileSelect(id, e.target.files[0]);
              }
            }}
          />
        </label>
      ) : (
        <label className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-border/70 bg-muted/10 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload size={18} className="text-primary" />
          </div>
          <div className="text-center">
            <span className="text-xs font-medium text-foreground">
              Clique para enviar
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPG, PNG ou PDF até 10MB
            </p>
          </div>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleFileSelect(id, e.target.files[0])
            }
          />
        </label>
      )}
    </div>
  );
}

interface IDocumentsStepProps {
  labelClass: string;
}

export default function DocumentsStep({ labelClass }: IDocumentsStepProps) {
  const { isPj } = useKycOnboardingStore();

  return (
    <div className="space-y-5 animate-step-slide">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
        <Camera size={18} className="text-primary flex-shrink-0" />
        <p className="text-xs text-foreground/80 leading-relaxed">
          Envie fotos nítidas e legíveis. Documentos borrados ou cortados serão
          rejeitados.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FileUploadBox
          id="document_front"
          label={
            isPj() ? "RG/CNH do Representante (Frente)" : "RG ou CNH (Frente)"
          }
          labelClass={labelClass}
        />
        <FileUploadBox
          id="document_back"
          label={
            isPj() ? "RG/CNH do Representante (Verso)" : "RG ou CNH (Verso)"
          }
          labelClass={labelClass}
        />
      </div>
      <FileUploadBox
        id="selfie"
        label="Selfie segurando o documento"
        accept="image/*"
        labelClass={labelClass}
      />
      <FileUploadBox
        id="proof_of_address"
        label="Comprovante de Endereço (últimos 3 meses)"
        labelClass={labelClass}
      />

      {isPj() && (
        <FileUploadBox
          id="company_contract"
          label="Contrato Social ou Requerimento de Empresário"
          accept="image/*,.pdf"
          labelClass={labelClass}
        />
      )}
    </div>
  );
}
