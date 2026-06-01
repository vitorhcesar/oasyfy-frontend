interface IEmptyStateProps {
  message?: string;
}

export default function EmptyState({
  message = "Nenhum produtor encontrado.",
}: IEmptyStateProps) {
  return (
    <div className="text-center py-20">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
