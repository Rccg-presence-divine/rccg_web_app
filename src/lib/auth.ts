import { headers } from "next/headers";

/**
 * Type d'utilisateur injecté par le proxy
 */
export type AuthUser = {
  userId: string; // 
  role: "SUPERADMIN" | "PASTOR" | "MODERATOR" | "USER";
};

/**
 * Récupère l'utilisateur authentifié depuis les headers
 * (injectés par proxy.ts)
 */
export async function getAuthUser(): Promise<AuthUser> {
  const headersList = await headers();

  const userId = headersList.get("x-user-id");
  const role = headersList.get("x-user-role");

  if (!userId || !role) {
    throw new Error("Utilisateur non authentifié");
  }

  // Vérifier que le rôle est valide
  const validRoles: AuthUser["role"][] = ["SUPERADMIN", "PASTOR", "MODERATOR", "USER"];
  if (!validRoles.includes(role as AuthUser["role"])) {
    throw new Error("Rôle invalide");
  }

  return {
    userId,
    role: role as AuthUser["role"],
  };
}

/**
 * Vérifie que l'utilisateur est connecté
 */
export async function requireAuth(): Promise<AuthUser> {
  return await getAuthUser();
}

/**
 * Vérifie que l'utilisateur a un rôle spécifique
 */
export async function requireRole(requiredRole: AuthUser["role"]): Promise<AuthUser> {
  const user = await getAuthUser();

  if (user.role !== requiredRole) {
    throw new Error("Accès interdit");
  }

  return user;
}

/**
 * Vérifie que l'utilisateur a l'un des rôles autorisés
 */
export async function requireAnyRole(roles: AuthUser["role"][]): Promise<AuthUser> {
  const user = await getAuthUser();

  if (!roles.includes(user.role)) {
    throw new Error("Accès interdit");
  }

  return user;
}