export function statusBadgeClasses(status: string) {
  if (status === "approved") {
    return "border-success/25 bg-success/10 text-success";
  }
  if (status === "partially_approved") {
    return "border-primary/25 bg-primary/10 text-primary";
  }
  if (status === "rejected") {
    return "border-destructive/25 bg-destructive/10 text-destructive";
  }
  return "border-warning/25 bg-warning/10 text-warning";
}
