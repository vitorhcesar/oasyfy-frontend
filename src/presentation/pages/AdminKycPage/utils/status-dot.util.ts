export function statusDot(status: string) {
  if (status === "approved") return "bg-primary";
  if (status === "rejected") return "bg-destructive";
  return "bg-muted-foreground/40";
}
