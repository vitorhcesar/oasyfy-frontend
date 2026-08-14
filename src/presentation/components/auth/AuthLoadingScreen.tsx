export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-[3px] border-muted" />
        <div
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <div
          className="absolute inset-[6px] rounded-full border-[3px] border-transparent border-b-primary/50"
          style={{ animation: "spin 1.2s linear infinite reverse" }}
        />
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">
        Carregando...
      </p>
    </div>
  );
}
