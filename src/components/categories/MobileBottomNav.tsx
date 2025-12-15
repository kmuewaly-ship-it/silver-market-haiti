import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, Sparkles, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/auth";

const MobileBottomNav = () => {
  const location = useLocation();
  const { role } = useAuth();
  
  const accountLink = role === UserRole.SELLER ? "/seller/cuenta" : "/cuenta";
  
  const navItems = [
    { href: "/", icon: Home, label: "Acheter", activeIcon: Home },
    { href: "/categorias", icon: LayoutGrid, label: "Catégories", activeIcon: LayoutGrid },
    { href: "/productos", icon: Sparkles, label: "Tendances", activeIcon: Sparkles, hasDot: true },
    { href: "/carrito", icon: ShoppingBag, label: "Panier", activeIcon: ShoppingBag, badge: "99+" },
    { href: accountLink, icon: User, label: "Moi", activeIcon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href === "/categorias" && location.pathname.startsWith("/categoria"));
          
          const IconComponent = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[60px] h-full",
                "transition-colors"
              )}
            >
              <div className="relative">
                <IconComponent 
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-gray-900" : "text-gray-500"
                  )} 
                  strokeWidth={isActive ? 2 : 1.5}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-3 min-w-[20px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge}
                  </span>
                )}
                {item.hasDot && (
                  <span className="absolute -top-0.5 right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </div>
              <span className={cn(
                "text-[10px]",
                isActive ? "text-gray-900 font-medium" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
