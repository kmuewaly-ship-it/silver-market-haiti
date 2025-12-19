import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import Header from "./Header";
import HeaderB2B from "@/components/b2b/HeaderB2B";

interface GlobalHeaderProps {
  /** Props para el HeaderB2B cuando el usuario es seller */
  selectedCategoryId?: string | null;
  onCategorySelect?: (categoryId: string | null) => void;
  onSearch?: (query: string) => void;
}

/**
 * GlobalHeader - Renderiza el header apropiado según el rol del usuario
 * - Admin/Seller: HeaderB2B (azul/verde)
 * - Client/Guest: Header regular (rojo)
 */
const GlobalHeader = ({ 
  selectedCategoryId = null,
  onCategorySelect,
  onSearch
}: GlobalHeaderProps) => {
  const { role, isLoading } = useAuth();
  const isMobile = useIsMobile();

  // En mobile no mostramos este header (GlobalMobileHeader se encarga)
  if (isMobile) {
    return null;
  }

  // Mientras carga la autenticación, mostrar header regular por defecto
  if (isLoading) {
    return <Header />;
  }

  // Seller o Admin: mostrar HeaderB2B
  if (role === UserRole.SELLER || role === UserRole.ADMIN) {
    return (
      <HeaderB2B
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={onCategorySelect}
        onSearch={onSearch}
      />
    );
  }

  // Cliente o no autenticado: Header regular
  return <Header />;
};

export default GlobalHeader;
