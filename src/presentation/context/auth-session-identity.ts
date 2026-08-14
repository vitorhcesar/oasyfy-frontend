import type { Session, User } from "better-auth/types";
import { useRef } from "react";

function timestampOf(value: Date | string | number | undefined): string {
  if (value == null) return "";
  return String(value);
}

export function isSameUserIdentity(a: User | null, b: User | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.email === b.email &&
    a.name === b.name &&
    a.emailVerified === b.emailVerified &&
    timestampOf(a.updatedAt) === timestampOf(b.updatedAt)
  );
}

export function isSameSessionIdentity(
  a: Session | null,
  b: Session | null,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.id === b.id && timestampOf(a.expiresAt) === timestampOf(b.expiresAt);
}

/**
 * Mantém a referência anterior quando a identidade não mudou, para o
 * refetch da sessão não forçar re-render/efeito em toda a árvore autenticada.
 */
export function useStableValue<T>(
  next: T,
  isSame: (previous: T, current: T) => boolean,
): T {
  const ref = useRef(next);
  if (!isSame(ref.current, next)) {
    ref.current = next;
  }
  return ref.current;
}
