export function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest mb-4">
      {text}
    </p>
  );
}
