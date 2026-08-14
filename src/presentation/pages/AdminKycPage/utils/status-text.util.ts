export function statusText(status: string) {
  if (status === "approved") return "Aprovado";
  if (status === "partially_approved") return "Parcialmente aprovado";
  if (status === "rejected") return "Recusado";
  return "Pendente";
}
