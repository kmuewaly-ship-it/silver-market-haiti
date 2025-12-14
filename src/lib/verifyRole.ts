import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

interface VerifyRoleResponse {
  authorized: boolean;
  userId?: string;
  userRole?: string;
  error?: string;
  message?: string;
}

/**
 * Verifica el rol del usuario en el backend para doble seguridad
 * Útil antes de operaciones sensibles
 * 
 * @param requiredRoles - Array de roles permitidos
 * @returns Promise con el resultado de la verificación
 * 
 * @example
 * const result = await verifyRole([UserRole.ADMIN, UserRole.SELLER]);
 * if (!result.authorized) {
 *   toast.error('No tienes permisos para esta acción');
 *   return;
 * }
 */
export const verifyRole = async (requiredRoles: UserRole[]): Promise<VerifyRoleResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-role', {
      body: { requiredRoles }
    });

    if (error) {
      console.error('Error verifying role:', error);
      return {
        authorized: false,
        error: error.message || 'Error al verificar permisos'
      };
    }

    return data as VerifyRoleResponse;
  } catch (error) {
    console.error('Error calling verify-role function:', error);
    return {
      authorized: false,
      error: 'Error de conexión al verificar permisos'
    };
  }
};

/**
 * Verifica si el usuario actual es administrador
 */
export const verifyIsAdmin = async (): Promise<boolean> => {
  const result = await verifyRole([UserRole.ADMIN]);
  return result.authorized;
};

/**
 * Verifica si el usuario actual es vendedor o administrador
 */
export const verifyIsSeller = async (): Promise<boolean> => {
  const result = await verifyRole([UserRole.SELLER, UserRole.ADMIN]);
  return result.authorized;
};

/**
 * Verifica si el usuario está autenticado (cualquier rol)
 */
export const verifyIsAuthenticated = async (): Promise<boolean> => {
  const result = await verifyRole([]);
  return result.authorized;
};
