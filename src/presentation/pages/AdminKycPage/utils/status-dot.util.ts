export function statusDot(status: string) {
  if (status === "approved") return "bg-success";
  if (status === "partially_approved") return "bg-primary";
  if (status === "rejected") return "bg-destructive";
  return "bg-warning";
}
