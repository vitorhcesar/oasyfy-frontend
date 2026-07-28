export function SectionLabel({ text }: { text: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
      {text}
    </p>
  );
}
