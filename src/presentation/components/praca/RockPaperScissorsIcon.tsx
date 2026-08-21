import { cn } from "@/presentation/utils/cn";
import { FileText, Hand, Scissors } from "lucide-react";

export function RockPaperScissorsIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center", className)}
      aria-hidden
    >
      <Hand className="size-[42%]" />
      <FileText className="-mx-[6%] size-[42%]" />
      <Scissors className="size-[42%]" />
    </span>
  );
}
