export function isApprovedTransactionStatus(status: string): boolean {
  return status === "paid" || status === "completed";
}

export function matchesTransactionStatusFilter(
  status: string,
  filter: string,
): boolean {
  if (!filter || filter === "all") return true;
  if (filter === "completed") {
    return isApprovedTransactionStatus(status);
  }
  return status === filter;
}
