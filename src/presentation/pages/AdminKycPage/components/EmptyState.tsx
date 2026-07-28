interface IEmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = "Nenhum produtor encontrado.",
}: IEmptyStateProps) {
  return (
    <div className="admin-surface px-6 py-20 text-center">
      <p className="text-base text-muted-foreground">{message}</p>
    </div>
  );
}
