export function statusDot(status: string) {
  if (status === "approved") return "bg-success";
  if (status === "rejected") return "bg-destructive";
  return "bg-warning";
}
