import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, Search, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePublicCategories, Category } from "@/hooks/useCategories";
import CategoryCard from "@/components/landing/CategoryCard";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMobileCategory, setOpenMobileCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories = [], isLoading: categoriesLoading } = usePublicCategories();

  // Root categories (no parent)
  const rootCategories: Category[] = categories.filter((c: Category) => !c.parent_id);

  const getSubcategories = (parentId: string) =>
    categories.filter((c: Category) => c.parent_id === parentId);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
      {/* Top Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>Envío desde el extranjero</span>
              <span>•</span>
              <span>Devolución Gratis</span>
            </div>
            <div className="flex items-center gap-4">
              <button>Centro de Ayuda</button>
              <span>•</span>
              <Link to="/admin/login">Vender</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded bg-red-500 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">SIVER</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 mx-8 max-w-md">
            <div className="relative w-full">
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-6">
            <button className="flex flex-col items-center gap-1 text-gray-700 hover:text-red-500 transition">
              <Heart className="w-6 h-6" />
              <span className="text-xs">Favoritos</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-700 hover:text-red-500 transition">
              <User className="w-6 h-6" />
              <span className="text-xs">Cuenta</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-700 hover:text-red-500 transition">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-xs">Carrito</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Categories Bar */}
        <div className="hidden lg:flex items-center overflow-x-auto gap-0 border-t border-gray-200 h-12 relative">
          {categoriesLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Cargando categorías...</div>
          ) : (
            rootCategories.map((cat) => {
              const subs = getSubcategories(cat.id);
              return (
                <div key={cat.id} className="relative group">
                  <Link
                    to={`/categoria/${cat.slug}`}
                    className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-red-500 hover:bg-gray-50 border-b-2 border-transparent hover:border-red-500 transition whitespace-nowrap flex items-center gap-2"
                  >
                    {cat.name}
                  </Link>

                  {/* Subcategories dropdown on hover */}
                  {subs.length > 0 && (
                    <div className="absolute left-0 top-full mt-2 hidden group-hover:flex p-4 bg-white border border-gray-100 shadow-lg rounded-lg z-40">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {subs.map((sub) => (
                          <Link key={sub.id} to={`/categoria/${sub.slug}`} className="flex flex-col items-center text-center w-32">
                            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center mb-2 border border-border">
                              {sub.icon ? (
                                <img src={sub.icon} alt={sub.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <span className="text-xl text-muted-foreground">{sub.name.charAt(0).toUpperCase()}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-700">{sub.name}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <Input type="text" placeholder="Buscar..." className="w-full mb-4 rounded-full" />

            <nav className="flex flex-col gap-2">
              {rootCategories.map((cat) => {
                const subs = getSubcategories(cat.id);
                const isOpen = openMobileCategory === cat.id;
                return (
                  <div key={cat.id} className="border-b border-gray-100">
                    <button
                      onClick={() => setOpenMobileCategory(isOpen ? null : cat.id)}
                      className="w-full text-left py-3 px-2 flex items-center justify-between text-gray-800 hover:bg-gray-50"
                    >
                      <span className="font-medium">{cat.name}</span>
                      <span className="text-sm text-gray-500">{subs.length > 0 ? (isOpen ? "-" : "+") : ""}</span>
                    </button>

                    {isOpen && subs.length > 0 && (
                      <div className="px-2 py-2 bg-white">
                        <div className="grid grid-cols-3 gap-2">
                          {subs.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/categoria/${sub.slug}`}
                              onClick={() => setIsMenuOpen(false)}
                              className="flex flex-col items-center text-center p-2"
                            >
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center mb-2 border border-border">
                                {sub.icon ? (
                                  <img src={sub.icon} alt={sub.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <span className="text-xl text-muted-foreground">{sub.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-gray-700">{sub.name}</div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;