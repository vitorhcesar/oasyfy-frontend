import { cn } from "@/presentation/utils/cn";
import { forwardRef } from "react";
import { Link, useMatch, type LinkProps } from "react-router-dom";

interface NavLinkProps extends Omit<LinkProps, "to" | "className" | "children"> {
  to: string;
  end?: boolean;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLink(
    { to, end, className, activeClassName, children, ...rest },
    ref,
  ) {
    const match = useMatch({ path: to, end });

    return (
      <Link
        ref={ref}
        to={to}
        className={cn(className, match && activeClassName)}
        {...rest}
      >
        {children}
      </Link>
    );
  },
);
