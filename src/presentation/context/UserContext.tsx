import type { User } from "better-auth/types";
import { createContext, PropsWithChildren, useContext } from "react";

const UserContext = createContext<User | null>(null);

interface IUserContextProviderProps extends PropsWithChildren {
  user: User;
}

/**
 * Fornece o usuário autenticado com tipo não-nullable.
 * Deve ser renderizado apenas dentro de rotas protegidas (ProtectedRoute),
 * onde a presença do usuário já foi verificada.
 */
export function UserContextProvider({
  user,
  children,
}: IUserContextProviderProps) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

/**
 * Retorna o usuário autenticado atual.
 * Lança erro se usado fora de um ProtectedRoute (UserContextProvider).
 * O retorno é sempre não-null por design.
 */
export function useUserContext(): User {
  const user = useContext(UserContext);
  if (!user) {
    throw new Error(
      "useUserContext deve ser usado dentro de UserContextProvider (dentro de um ProtectedRoute)"
    );
  }
  return user;
}
