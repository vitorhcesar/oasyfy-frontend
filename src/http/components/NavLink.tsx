import { cn } from "@/http/utils/cn";
import { Link, useMatch } from "react-router-dom";

interface NavLinkProps {
  to: string;
  end?: boolean;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export function NavLink({
  to,
  end,
  className,
  activeClassName,
  children,
}: NavLinkProps) {
  const match = useMatch({ path: to, end });

  return (
    <Link to={to} className={cn(className, match && activeClassName)}>
      {children}
    </Link>
  );
}
