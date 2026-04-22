import { Construction } from 'lucide-react';

interface UnderConstructionProps {
  title?: string;
  description?: string;
}

export function UnderConstruction({ title = 'Em construção', description = 'Estamos trabalhando nesta funcionalidade. Em breve estará disponível.' }: UnderConstructionProps) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <Construction size={28} className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="mt-6 flex items-center justify-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
